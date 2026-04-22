
import { createClient } from "./client";

export async function getStudyTasks(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('study_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching study tasks:', error);
        return [];
    }
    return data;
}

export async function createStudyTask(userId: string, subject: string, topic: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('study_tasks')
        .insert({
            user_id: userId,
            subject: subject,
            topic: topic,
            is_completed: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating study task:', error);
        return null;
    }
    return data;
}

export async function updateStudyTask(taskId: string, updates: { topic?: string, is_completed?: boolean }) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('study_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        console.error('Error updating study task:', error);
        return null;
    }
    return data;
}

export async function deleteStudyTask(taskId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('study_tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error deleting study task:', error);
        return false;
    }
    return true;
}

export async function initializeStudyTasks(userId: string, defaultTasks: Record<string, string[]>) {
    const supabase = createClient();
    
    const tasksToInsert = Object.entries(defaultTasks).flatMap(([subject, topics]) => 
        topics.map(topic => ({
            user_id: userId,
            subject,
            topic,
            is_completed: false
        }))
    );

    const { data, error } = await supabase
        .from('study_tasks')
        .insert(tasksToInsert)
        .select();

    if (error) {
        console.error('Error initializing study tasks:', error);
        return [];
    }
    return data;
}
