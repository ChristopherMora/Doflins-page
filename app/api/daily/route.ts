import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyFigures, dailyClaims, userStreaks, doflins, userPoints, pointTransactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

// Get today's date in YYYY-MM-DD format (UTC)
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Get yesterday's date in YYYY-MM-DD format (UTC)
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

// Calculate streak bonus points
function getStreakBonus(streak: number): number {
  if (streak >= 30) return 25;
  if (streak >= 14) return 15;
  if (streak >= 7) return 10;
  if (streak >= 3) return 5;
  return 0;
}

// GET - Get today's featured figure and user claim status
export async function GET(request: NextRequest) {
  const db = getDb();
  const today = getTodayDate();

  // Check if we have a daily figure for today
  const [existingDaily] = await db
    .select()
    .from(dailyFigures)
    .where(eq(dailyFigures.date, today))
    .limit(1);

  let dailyFigureId = existingDaily?.id;
  let doflinId = existingDaily?.doflinId;
  let pointsReward = existingDaily?.pointsReward ?? 5;

  // If no daily figure for today, select one randomly
  if (!existingDaily) {
    const [randomDoflin] = await db
      .select()
      .from(doflins)
      .where(eq(doflins.activo, true))
      .orderBy(sql`RAND()`)
      .limit(1);

    if (!randomDoflin) {
      return NextResponse.json({ error: "No figures available" }, { status: 404 });
    }

    // Create today's daily figure
    const [inserted] = await db
      .insert(dailyFigures)
      .values({
        doflinId: randomDoflin.id,
        date: today,
        pointsReward: 5,
      })
      .$returningId();

    dailyFigureId = inserted.id;
    doflinId = randomDoflin.id;
    pointsReward = 5;
  }

  // Get the doflin details
  const [doflin] = await db
    .select()
    .from(doflins)
    .where(eq(doflins.id, doflinId!))
    .limit(1);

  if (!doflin) {
    return NextResponse.json({ error: "Figure not found" }, { status: 404 });
  }

  // Check if user is authenticated and their claim status
  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  
  let claimed = false;
  let userStreakData = { currentStreak: 0, longestStreak: 0 };

  if (user) {
    // Check if user has claimed today's figure
    const [existingClaim] = await db
      .select()
      .from(dailyClaims)
      .where(and(
        eq(dailyClaims.supabaseUserId, user.id),
        eq(dailyClaims.dailyFigureId, dailyFigureId!)
      ))
      .limit(1);
    
    claimed = !!existingClaim;

    // Get user's streak info
    const [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.supabaseUserId, user.id))
      .limit(1);

    if (streak) {
      userStreakData = {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      };
    }
  }

  return NextResponse.json({
    figure: {
      id: doflin.id,
      nombre: doflin.nombre,
      imagenUrl: doflin.imagenUrl,
      rareza: doflin.rareza,
      serie: doflin.serie,
      datoCurioso: doflin.datoCurioso,
    },
    pointsReward,
    claimed,
    streak: userStreakData,
    streakBonus: getStreakBonus(userStreakData.currentStreak + (claimed ? 0 : 1)),
  });
}

// POST - Claim today's daily figure points
export async function POST(request: NextRequest) {
  const db = getDb();
  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // Get today's daily figure
  const [dailyFigure] = await db
    .select()
    .from(dailyFigures)
    .where(eq(dailyFigures.date, today))
    .limit(1);

  if (!dailyFigure) {
    return NextResponse.json({ error: "No daily figure today" }, { status: 404 });
  }

  // Check if already claimed
  const [existingClaim] = await db
    .select()
    .from(dailyClaims)
    .where(and(
      eq(dailyClaims.supabaseUserId, user.id),
      eq(dailyClaims.dailyFigureId, dailyFigure.id)
    ))
    .limit(1);

  if (existingClaim) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
  }

  // Get or create user streak
  const [streak] = await db
    .select()
    .from(userStreaks)
    .where(eq(userStreaks.supabaseUserId, user.id))
    .limit(1);

  let newStreak = 1;
  if (streak) {
    // Check if continuing streak (claimed yesterday)
    if (streak.lastClaimDate === yesterday) {
      newStreak = streak.currentStreak + 1;
    }
    // If last claim was today, don't reset (edge case)
    else if (streak.lastClaimDate === today) {
      newStreak = streak.currentStreak;
    }
    // Otherwise, streak resets to 1
  }

  const streakBonus = getStreakBonus(newStreak);
  const totalPoints = dailyFigure.pointsReward + streakBonus;

  // Transaction: Create claim, update streak, award points
  try {
    await db.transaction(async (tx) => {
      // Create daily claim
      await tx.insert(dailyClaims).values({
        supabaseUserId: user.id,
        dailyFigureId: dailyFigure.id,
        pointsAwarded: dailyFigure.pointsReward,
        streakBonus: streakBonus,
      });

      // Update or create streak
      if (streak) {
        await tx
          .update(userStreaks)
          .set({
            currentStreak: newStreak,
            longestStreak: Math.max(streak.longestStreak, newStreak),
            lastClaimDate: today,
          })
          .where(eq(userStreaks.supabaseUserId, user.id));
      } else {
        await tx.insert(userStreaks).values({
          supabaseUserId: user.id,
          currentStreak: 1,
          longestStreak: 1,
          lastClaimDate: today,
        });
      }

      // Award base points
      await tx.insert(pointTransactions).values({
        supabaseUserId: user.id,
        amount: dailyFigure.pointsReward,
        reason: "daily_claim",
        meta: JSON.stringify({ dailyFigureId: dailyFigure.id }),
      });

      // Award streak bonus if applicable
      if (streakBonus > 0) {
        await tx.insert(pointTransactions).values({
          supabaseUserId: user.id,
          amount: streakBonus,
          reason: "streak_bonus",
          meta: JSON.stringify({ streak: newStreak }),
        });
      }

      // Update user points balance
      await tx
        .insert(userPoints)
        .values({
          supabaseUserId: user.id,
          balance: totalPoints,
          totalEarned: totalPoints,
        })
        .onDuplicateKeyUpdate({
          set: {
            balance: sql`${userPoints.balance} + ${totalPoints}`,
            totalEarned: sql`${userPoints.totalEarned} + ${totalPoints}`,
          },
        });
    });
  } catch (err) {
    console.error("[daily POST] transaction failed:", err);
    return NextResponse.json({ error: "No se pudieron guardar los puntos. Intenta de nuevo." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    pointsAwarded: dailyFigure.pointsReward,
    streakBonus,
    totalPoints,
    newStreak,
  });
}
