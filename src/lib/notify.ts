import "server-only";
import crypto from "node:crypto";
import { BRAND, LINKS } from "./config";
import type { CheckinInput } from "./types";

/**
 * 키오스크 5단계 마지막 — 입력 정보로 카카오톡(알림톡) 자동 발송.
 *
 * 제공자(Provider) 추상화:
 *  - solapi  : 카카오 알림톡(템플릿) 발송, 실패 시 SMS 대체 가능
 *  - sms     : 일반 SMS(문자)만 발송 (Solapi 채널/템플릿 없이 시작할 때)
 *  - console : 키 미설정 시 서버 로그로만 출력 (개발/미연동 상태)
 *
 * 환경변수(.env.local):
 *  NOTIFY_PROVIDER=solapi | sms | console   (기본: 키 있으면 solapi, 없으면 console)
 *  SOLAPI_API_KEY=...
 *  SOLAPI_API_SECRET=...
 *  SOLAPI_SENDER=발신번호(사전등록)         예) 01012345678
 *  KAKAO_PF_ID=발신프로필키(채널)
 *  KAKAO_TEMPLATE_ID=알림톡 템플릿 ID
 */

export interface NotifyResult {
  ok: boolean;
  channel: "kakao" | "sms" | "console";
  error?: string;
}

type Lang = CheckinInput["language"];

/** 알림톡 템플릿에 채울 변수 + SMS 대체 문구 생성 */
export function buildMessage(input: CheckinInput): {
  variables: Record<string, string>;
  smsText: string;
} {
  const ko = input.language === "ko";
  const name = input.name.trim();

  // 키 이름은 Solapi 콘솔에 등록한 알림톡 템플릿의 변수명과 정확히 일치해야 한다.
  const variables: Record<string, string> = {
    "#{이름}": name,
    "#{홈페이지}": LINKS.homepage,
    "#{예약}": LINKS.reservation,
    "#{설문}": LINKS.survey,
    "#{가이드}": LINKS.guide,
  };

  const smsText = ko
    ? [
        `[${BRAND.nameEn}] ${name}님 체크인 완료!`,
        `오늘도 안전하게 운동하세요 🌊`,
        ``,
        `· 기구 사용법: ${LINKS.guide}`,
        `· 클래스 예약: ${LINKS.reservation}`,
        `· 홈페이지: ${LINKS.homepage}`,
        `· 이용 후기: ${LINKS.survey}`,
      ].join("\n")
    : [
        `[${BRAND.nameEn}] Check-in complete, ${name}!`,
        `Have a great workout 🌊`,
        ``,
        `· Equipment guide: ${LINKS.guide}`,
        `· Class booking: ${LINKS.reservation}`,
        `· Homepage: ${LINKS.homepage}`,
        `· Feedback: ${LINKS.survey}`,
      ].join("\n");

  return { variables, smsText };
}

function resolveProvider(): "solapi" | "sms" | "console" {
  const explicit = process.env.NOTIFY_PROVIDER as
    | "solapi"
    | "sms"
    | "console"
    | undefined;
  if (explicit) return explicit;
  if (process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET) {
    return "solapi";
  }
  return "console";
}

/** 메인 진입점 — 체크인 1건에 대해 알림 발송 */
export async function sendCheckinNotification(
  input: CheckinInput,
): Promise<NotifyResult> {
  const provider = resolveProvider();
  const { variables, smsText } = buildMessage(input);
  const to = input.phone.replace(/[^0-9]/g, "");

  if (provider === "console") {
    console.info(
      `[notify:console] → ${to}\n${smsText}\n(variables: ${JSON.stringify(variables)})`,
    );
    return { ok: true, channel: "console" };
  }

  try {
    if (provider === "solapi") {
      return await sendViaSolapiKakao(to, variables);
    }
    return await sendViaSolapiSms(to, smsText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notify] 발송 실패:", msg);
    return {
      ok: false,
      channel: provider === "solapi" ? "kakao" : "sms",
      error: msg,
    };
  }
}

// ---------- Solapi ----------

function solapiAuthHeader(): string {
  const apiKey = process.env.SOLAPI_API_KEY!;
  const apiSecret = process.env.SOLAPI_API_SECRET!;
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function solapiSend(message: Record<string, unknown>): Promise<void> {
  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      Authorization: solapiAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    statusCode?: string;
    statusMessage?: string;
    errorMessage?: string;
  };
  if (!res.ok || (json.statusCode && json.statusCode !== "2000")) {
    throw new Error(
      json.errorMessage || json.statusMessage || `Solapi HTTP ${res.status}`,
    );
  }
}

async function sendViaSolapiKakao(
  to: string,
  variables: Record<string, string>,
): Promise<NotifyResult> {
  const from = process.env.SOLAPI_SENDER!;
  const pfId = process.env.KAKAO_PF_ID!;
  const templateId = process.env.KAKAO_TEMPLATE_ID!;
  if (!from || !pfId || !templateId) {
    throw new Error(
      "Solapi/카카오 환경변수 누락(SOLAPI_SENDER, KAKAO_PF_ID, KAKAO_TEMPLATE_ID)",
    );
  }
  await solapiSend({
    to,
    from, // 사전 등록된 발신번호 (대체발송 SMS 발신자)
    kakaoOptions: {
      pfId,
      templateId,
      variables,
      // disableSms:false → 알림톡 실패 시 템플릿 내용으로 SMS 자동 대체발송.
      // 별도 대체문구를 쓰려면 Solapi 콘솔의 템플릿 대체발송 설정을 이용한다.
      disableSms: false,
    },
  });
  return { ok: true, channel: "kakao" };
}

async function sendViaSolapiSms(
  to: string,
  text: string,
): Promise<NotifyResult> {
  const from = process.env.SOLAPI_SENDER!;
  if (!from) throw new Error("SOLAPI_SENDER(발신번호) 미설정");
  await solapiSend({ to, from, text });
  return { ok: true, channel: "sms" };
}
