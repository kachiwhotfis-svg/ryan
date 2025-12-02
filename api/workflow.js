import { runWorkflow } from './agent-workflow.js';

export default async function handler(req, res) {
  // Set CORS headers for n8n
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { input_as_text } = req.body;
    
    if (!input_as_text) {
      return res.status(400).json({ 
        error: 'Missing required field: input_as_text',
        example: { input_as_text: "Calculate racking for warehouse..." }
      });
    }

    console.log('Processing workflow request:', input_as_text);
    
    const result = await runWorkflow({ input_as_text });
    
    return res.status(200).json({ 
      success: true,
      output_text: result.output_text,
      workflow_id: "wf_69083c37432481908d485c9ec3ca940e06dd0e49d2752ae6"
    });
    
  } catch (error) {
    console.error('Workflow execution error:', error);
    return res.status(500).json({ 
      error: 'Workflow execution failed',
      message: error.message,
      details: error.stack
    });
  }
}
