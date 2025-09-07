import { supabase } from '@/utils/supabase/client';

export const db = {
  getAll: async <T = any>(
    table: string,
    filters: Record<string, any> = {},
    select = '*'
  ): Promise<T[]> => {
    let query = supabase.from(table).select(select);

    Object.entries(filters).forEach(([col, val]) => {
      query = query.eq(col, val);
    });

    const { data, error } = await query;
    if (error) throw error;
    return data as T[];
  },

  getOne: async <T = any>(
    table: string,
    id: number | string,
    idField = 'id',
    select = '*'
  ): Promise<T> => {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq(idField, id)
      .single();

    if (error) throw error;
    return data as T;
  },

  insert: async <T = any>(table: string, values: any): Promise<T> => {
    const { data, error } = await supabase
      .from(table)
      .insert(values)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  },

  update: async <T = any>(
    table: string,
    id: number | string,
    values: any,
    idField = 'id'
  ): Promise<T> => {
    const { data, error } = await supabase
      .from(table)
      .update(values)
      .eq(idField, id)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  },

  remove: async (
    table: string,
    id: number | string,
    idField = 'id'
  ): Promise<void> => {
    const { error } = await supabase.from(table).delete().eq(idField, id);

    if (error) throw error;
  },
};
