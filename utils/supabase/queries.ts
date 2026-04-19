
import { createClient } from "./client";

export async function updateDailyStreak(userId: string) {
    const supabase = createClient();
    
    // 1. Get current user to access metadata
    const { data: { user }, error: fetchError } = await supabase.auth.getUser();

    if (fetchError || !user) {
        console.error('Error fetching user for streak:', fetchError);
        return;
    }

    const metadata = user.user_metadata || {};
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const lastLogin = metadata.last_login_date;
    const currentStreak = metadata.streak || 0;

    if (lastLogin === today) {
        // Already logged in today, do nothing
        return;
    }

    let newStreak = 1;
    if (lastLogin === yesterday) {
        // Consecutive login
        newStreak = currentStreak + 1;
    } else {
        // Streak broken or first login
        newStreak = 1;
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
        data: {
            ...metadata,
            streak: newStreak,
            last_login_date: today,
            last_activity: new Date().toISOString()
        }
    });

    if (updateError) {
        console.error('Error updating status in metadata:', updateError);
    }
}

export async function updateGameStats(userId: string, gameResult: { score: number, total: number }) {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const metadata = user.user_metadata || {};
    
    // Update metadata with game stats if desired (total games, etc.)
    const totalGames = (metadata.total_games || 0) + 1;
    
    const { error } = await supabase.auth.updateUser({
        data: {
            ...metadata,
            total_games: totalGames,
            last_activity: new Date().toISOString()
        }
    });

    if (error) {
        console.error('Error updating game metadata:', error);
    }
}
