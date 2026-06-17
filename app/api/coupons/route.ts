import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, code: rawCode, reward, expiryDate } = body;

    // IP 주소 추출 (Vercel, Nginx 등 환경에 따라 다름. 자체 서버의 경우 x-forwarded-for 권장)
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    if (!gameId || !rawCode || !reward) {
      return NextResponse.json({ error: '필수 값이 누락되었습니다.' }, { status: 400 });
    }

    const code = rawCode.toUpperCase().trim();

    // 1. 해당 코드가 이미 DB에 있는지 확인
    let coupon = await db.coupon.findFirst({
      where: { code, gameId },
      include: { submittedBy: true }
    });

    if (coupon) {
      // 이미 활성화된 쿠폰인 경우
      if (coupon.isPublished) {
        return NextResponse.json({ message: '이미 등록 및 승인된 쿠폰입니다.' });
      }

      // 현재 IP가 이미 제보했는지 확인
      const hasAlreadySubmitted = coupon.submittedBy.some(action => action.ipAddress === ipAddress);
      if (hasAlreadySubmitted) {
        return NextResponse.json({ error: '이미 제보하신 쿠폰입니다.' }, { status: 429 });
      }

      // 새로운 UserAction(제보) 기록
      await db.userAction.create({
        data: {
          ipAddress,
          actionType: 'SUBMIT_COUPON',
          couponId: coupon.id,
        }
      });

      // 제출 횟수 체크 (새로 추가한 것 포함하여 계산)
      const submitCount = coupon.submittedBy.length + 1;
      
      // 3명 이상의 서로 다른 IP가 제보했다면 자동 공개(Published) 처리
      if (submitCount >= 3) {
        await db.coupon.update({
          where: { id: coupon.id },
          data: { isPublished: true }
        });
        return NextResponse.json({ message: '쿠폰이 다수결로 승인되어 즉시 공개되었습니다!' });
      }

      return NextResponse.json({ message: `제보가 누적되었습니다. (현재 ${submitCount}/3)` });
    } else {
      // 2. 아예 새로운 쿠폰인 경우 생성
      const newCoupon = await db.coupon.create({
        data: {
          code,
          gameId,
          reward,
          expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 기본 30일
          isPublished: false, // 최초 제보 시 비공개
          submittedBy: {
            create: {
              ipAddress,
              actionType: 'SUBMIT_COUPON'
            }
          }
        }
      });

      return NextResponse.json({ message: '쿠폰 제보가 완료되었습니다! 다른 유저들의 추가 제보 시 공개됩니다.' });
    }

  } catch (error) {
    console.error('Coupon Submit Error:', error);
    return NextResponse.json({ error: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}
