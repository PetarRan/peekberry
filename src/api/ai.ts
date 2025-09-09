// Client-side AI API - directly calls Supabase Edge Functions

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for edge functions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ElementContext {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  computedStyles: Record<string, string>;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface DOMMutation {
  type: 'style' | 'attribute' | 'content';
  selector: string;
  property: string;
  value: string;
  previousValue?: string;
}

export interface ProcessEditCommandRequest {
  command: string;
  context: ElementContext;
}

export interface GenerateCodeRequest {
  command: string;
  context: ElementContext;
  targetFramework?: 'vanilla' | 'react' | 'vue' | 'angular';
}

export interface GenerateCodeResponse {
  code: string;
  type: 'javascript' | 'css' | 'html';
  instructions: string[];
  dependencies?: string[];
}

export interface ElementAnalysis {
  suggestions: string[];
  capabilities: string[];
  editableProperties: string[];
}

export interface CommandValidation {
  valid: boolean;
  warnings: string[];
  risks: string[];
  confidence: number;
}

export interface AIAPI {
  processEditCommand(request: ProcessEditCommandRequest): Promise<DOMMutation>;
  generateCode(request: GenerateCodeRequest): Promise<GenerateCodeResponse>;
  analyzeElement(context: ElementContext): Promise<ElementAnalysis>;
  validateCommand(
    command: string,
    context: ElementContext
  ): Promise<CommandValidation>;
}

export const aiAPI: AIAPI = {
  async processEditCommand(
    request: ProcessEditCommandRequest
  ): Promise<DOMMutation> {
    const { data, error } = await supabase.functions.invoke(
      'process-edit-command',
      {
        body: request,
      }
    );

    if (error) {
      throw new Error(`AI processing failed: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error?.message || 'Failed to process edit command');
    }

    return data.mutation;
  },

  async generateCode(
    request: GenerateCodeRequest
  ): Promise<GenerateCodeResponse> {
    const { data, error } = await supabase.functions.invoke('generate-code', {
      body: request,
    });

    if (error) {
      throw new Error(`Code generation failed: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error?.message || 'Failed to generate code');
    }

    return data.result;
  },

  async analyzeElement(context: ElementContext): Promise<ElementAnalysis> {
    const { data, error } = await supabase.functions.invoke('analyze-element', {
      body: { context },
    });

    if (error) {
      throw new Error(`Element analysis failed: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error?.message || 'Failed to analyze element');
    }

    return data.analysis;
  },

  async validateCommand(
    command: string,
    context: ElementContext
  ): Promise<CommandValidation> {
    const { data, error } = await supabase.functions.invoke(
      'validate-command',
      {
        body: { command, context },
      }
    );

    if (error) {
      throw new Error(`Command validation failed: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error?.message || 'Failed to validate command');
    }

    return data.validation;
  },
};
