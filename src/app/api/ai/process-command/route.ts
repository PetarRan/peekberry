import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  PeekberryError,
  ERROR_CODES,
  logError,
  getUserFriendlyMessage,
  createPeekberryError,
} from '../../../../utils/errorHandling';

// JWT secret for extension token verification
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

interface ElementContext {
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

interface DOMMutation {
  type: 'style' | 'attribute' | 'content';
  selector: string;
  property: string;
  value: string;
  previousValue?: string;
}

interface ProcessCommandRequest {
  command: string;
  context: ElementContext;
}

/**
 * Verify extension token and extract user ID
 */
async function verifyExtensionToken(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

/**
 * Process natural language command and return DOM mutation
 */
async function processEditCommand(
  command: string,
  context: ElementContext
): Promise<DOMMutation> {
  // Simple AI processing logic for MVP
  // In production, this would call an actual AI service like OpenAI or Claude

  const lowerCommand = command.toLowerCase().trim();

  // Color changes
  if (lowerCommand.includes('red') || lowerCommand.includes('color red')) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'color',
      value: '#ef4444',
      previousValue: context.computedStyles.color || 'initial',
    };
  }

  if (lowerCommand.includes('blue') || lowerCommand.includes('color blue')) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'color',
      value: '#3b82f6',
      previousValue: context.computedStyles.color || 'initial',
    };
  }

  if (lowerCommand.includes('green') || lowerCommand.includes('color green')) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'color',
      value: '#22c55e',
      previousValue: context.computedStyles.color || 'initial',
    };
  }

  // Background color changes
  if (
    lowerCommand.includes('background red') ||
    lowerCommand.includes('bg red')
  ) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'backgroundColor',
      value: '#ef4444',
      previousValue: context.computedStyles.backgroundColor || 'initial',
    };
  }

  if (
    lowerCommand.includes('background blue') ||
    lowerCommand.includes('bg blue')
  ) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'backgroundColor',
      value: '#3b82f6',
      previousValue: context.computedStyles.backgroundColor || 'initial',
    };
  }

  // Size changes
  if (
    lowerCommand.includes('bigger') ||
    lowerCommand.includes('larger') ||
    lowerCommand.includes('increase size')
  ) {
    const currentSize = parseFloat(context.computedStyles.fontSize || '16');
    return {
      type: 'style',
      selector: context.selector,
      property: 'fontSize',
      value: `${Math.round(currentSize * 1.2)}px`,
      previousValue: context.computedStyles.fontSize || 'initial',
    };
  }

  if (
    lowerCommand.includes('smaller') ||
    lowerCommand.includes('decrease size')
  ) {
    const currentSize = parseFloat(context.computedStyles.fontSize || '16');
    return {
      type: 'style',
      selector: context.selector,
      property: 'fontSize',
      value: `${Math.round(currentSize * 0.8)}px`,
      previousValue: context.computedStyles.fontSize || 'initial',
    };
  }

  // Bold/weight changes
  if (lowerCommand.includes('bold') || lowerCommand.includes('bolder')) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'fontWeight',
      value: 'bold',
      previousValue: context.computedStyles.fontWeight || 'initial',
    };
  }

  if (
    lowerCommand.includes('normal weight') ||
    lowerCommand.includes('unbold')
  ) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'fontWeight',
      value: 'normal',
      previousValue: context.computedStyles.fontWeight || 'initial',
    };
  }

  // Hide/show
  if (lowerCommand.includes('hide') || lowerCommand.includes('invisible')) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'display',
      value: 'none',
      previousValue: context.computedStyles.display || 'initial',
    };
  }

  if (lowerCommand.includes('show') || lowerCommand.includes('visible')) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'display',
      value: 'block',
      previousValue: context.computedStyles.display || 'initial',
    };
  }

  // Border changes
  if (lowerCommand.includes('border') || lowerCommand.includes('outline')) {
    return {
      type: 'style',
      selector: context.selector,
      property: 'border',
      value: '2px solid #3b82f6',
      previousValue: context.computedStyles.border || 'initial',
    };
  }

  // Padding changes
  if (
    lowerCommand.includes('more padding') ||
    lowerCommand.includes('increase padding')
  ) {
    const currentPadding = parseFloat(context.computedStyles.padding || '8');
    return {
      type: 'style',
      selector: context.selector,
      property: 'padding',
      value: `${Math.round(currentPadding * 1.5)}px`,
      previousValue: context.computedStyles.padding || 'initial',
    };
  }

  // Text content changes
  if (
    lowerCommand.startsWith('change text to ') ||
    lowerCommand.startsWith('text ')
  ) {
    const newText = lowerCommand.replace(/^(change text to |text )/, '').trim();
    if (newText) {
      return {
        type: 'content',
        selector: context.selector,
        property: 'textContent',
        value: newText,
        previousValue: context.textContent || '',
      };
    }
  }

  // Default fallback - add a subtle highlight
  return {
    type: 'style',
    selector: context.selector,
    property: 'boxShadow',
    value: '0 0 0 2px #3b82f6',
    previousValue: context.computedStyles.boxShadow || 'initial',
  };
}

export async function POST(request: NextRequest) {
  const context = {
    component: 'API',
    operation: 'processCommand',
    url: request.url,
    timestamp: new Date(),
  };

  try {
    // Verify authentication
    const userId = await verifyExtensionToken(request);
    if (!userId) {
      const error = new PeekberryError(
        'Authentication required',
        ERROR_CODES.AUTH_REQUIRED,
        context
      );
      logError(error);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body with error handling
    let body: ProcessCommandRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      const error = new PeekberryError(
        'Invalid JSON in request body',
        ERROR_CODES.VALIDATION_ERROR,
        { ...context, userId: undefined }
      );
      logError(error);
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { command, context: elementContext } = body;

    // Validate input
    if (!command?.trim()) {
      const error = new PeekberryError(
        'Empty command provided',
        ERROR_CODES.AI_COMMAND_INVALID,
        { ...context, userId }
      );
      logError(error);
      return NextResponse.json(
        { success: false, error: 'Command is required' },
        { status: 400 }
      );
    }

    if (!elementContext) {
      const error = new PeekberryError(
        'Missing element context',
        ERROR_CODES.AI_CONTEXT_MISSING,
        { ...context, userId }
      );
      logError(error);
      return NextResponse.json(
        { success: false, error: 'Element context is required' },
        { status: 400 }
      );
    }

    if (!elementContext.selector) {
      const error = new PeekberryError(
        'Invalid element context - missing selector',
        ERROR_CODES.AI_CONTEXT_MISSING,
        { ...context, userId }
      );
      logError(error);
      return NextResponse.json(
        { success: false, error: 'Element selector is required' },
        { status: 400 }
      );
    }

    // Validate command length
    if (command.length > 1000) {
      const error = new PeekberryError(
        'Command too long',
        ERROR_CODES.AI_COMMAND_INVALID,
        { ...context, userId }
      );
      logError(error);
      return NextResponse.json(
        {
          success: false,
          error: 'Command is too long. Please keep it under 1000 characters.',
        },
        { status: 400 }
      );
    }

    // Process the command
    const mutation = await processEditCommand(command, elementContext);

    return NextResponse.json({
      success: true,
      data: {
        mutation,
        command,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const peekberryError =
      error instanceof PeekberryError
        ? error
        : createPeekberryError(
            error as Error,
            ERROR_CODES.AI_PROCESSING_FAILED,
            context
          );

    logError(peekberryError);

    // Return appropriate status code based on error type
    let statusCode = 500;
    if (
      peekberryError.code === ERROR_CODES.AUTH_REQUIRED ||
      peekberryError.code === ERROR_CODES.AUTH_TOKEN_INVALID
    ) {
      statusCode = 401;
    } else if (
      peekberryError.code === ERROR_CODES.VALIDATION_ERROR ||
      peekberryError.code === ERROR_CODES.AI_COMMAND_INVALID ||
      peekberryError.code === ERROR_CODES.AI_CONTEXT_MISSING
    ) {
      statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyMessage(peekberryError),
      },
      { status: statusCode }
    );
  }
}
