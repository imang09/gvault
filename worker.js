// worker.js
// 이 파일은 서버 백그라운드에서 PM2 등을 통해 24시간 실행되는 워커 스크립트입니다.
// 설치 필요: npm install node-cron @prisma/client

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🤖 EroArchive Background Worker가 시작되었습니다.');

// -----------------------------------------------------
// 1. 유효기간 만료 자동화 (Cron Job)
// 매일 자정 (00:00) 에 실행되어 유효기간이 지난 쿠폰들을 처리합니다.
// -----------------------------------------------------
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] 자정 업데이트 작업 시작: 만료 쿠폰 정리');
  try {
    const now = new Date();
    
    // expiryDate가 현재보다 과거이면서, 아직 isExpired가 false인 쿠폰들을 찾아서 업데이트
    const result = await prisma.coupon.updateMany({
      where: {
        expiryDate: {
          lt: now
        },
        isExpired: false
      },
      data: {
        isExpired: true
      }
    });

    console.log(`[Cron] 작업 완료: 총 ${result.count}개의 쿠폰이 만료 처리되었습니다.`);
  } catch (error) {
    console.error('[Cron Error] 쿠폰 만료 처리 중 오류 발생:', error);
  }
});

// -----------------------------------------------------
// 2. 디스코드 알림 봇 연동 가이드 (Optional)
// npm install discord.js
// -----------------------------------------------------
/*
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`🤖 디스코드 봇 로그인 완료: ${client.user.tag}`);
});

// 외부 API나 DB 트리거 이벤트 발생 시 채널로 메시지를 보내는 함수 예시
async function sendNewCouponAlert(gameName, code, reward) {
  const channelId = '여러분의_디스코드_채널_ID';
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    await channel.send(`🎉 **[${gameName}]** 새로운 쿠폰 도착!\n\`코드: ${code}\`\n보상: ${reward}`);
  }
}

client.login('여러분의_디스코드_봇_토큰');
*/

// 프로세스 종료 시 DB 연결 안전하게 해제
process.on('SIGINT', async () => {
  console.log('Worker shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
