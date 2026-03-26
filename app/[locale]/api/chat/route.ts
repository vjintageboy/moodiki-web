import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'placeholder_key' });

  // Initialize Supabase admin client strictly for backend database updates
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  try {
    const { messages, userId, conversationId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    let activeConversationId = conversationId;

    // 1. Create a conversation if none exists
    if (!activeConversationId) {
      const { data: newConv, error: convErr } = await supabaseAdmin
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: messages[0].content.substring(0, 50) + '...',
          last_message_preview: messages[0].content.substring(0, 100),
        })
        .select()
        .single();

      if (convErr) throw convErr;
      activeConversationId = newConv.id;
    } else {
      // Update last message preview
      await supabaseAdmin
        .from('ai_conversations')
        .update({
          last_message_preview: messages[messages.length - 1].content.substring(0, 100),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConversationId);
    }

    // 2. Map messages for Gemini GenAI SDK
    // @google/genai uses 'user' and 'model' for roles
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const latestMessage = messages[messages.length - 1].content;

    // Save user's latest message to DB
    await supabaseAdmin.from('ai_messages').insert({
      conversation_id: activeConversationId,
      user_id: userId,
      role: 'user',
      content: latestMessage,
    });

    // 3. Start chat session with Gemini
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a compassionate, professional mental health chatbot. Provide empathetic support and guidance. Warn users that you are an AI and they should consult a human professional for serious medical issues.'
      },
      history
    });

    // 4. Send message and wait for response
    const response = await chat.sendMessage(latestMessage);
    const aiResponseText = response.text || "I'm sorry, I couldn't process that.";

    // 5. Save AI's response to DB
    await supabaseAdmin.from('ai_messages').insert({
      conversation_id: activeConversationId,
      user_id: userId,
      role: 'assistant',
      content: aiResponseText,
      model_name: 'gemini-2.5-flash'
    });

    return NextResponse.json({
      activeConversationId,
      response: aiResponseText
    });

  } catch (error: any) {
    console.error('AI Chatbot error:', error);
    return NextResponse.json(
      { error: 'An error occurred during chat generation.' },
      { status: 500 }
    );
  }
}
