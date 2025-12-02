from agents import CodeInterpreterTool, Agent, ModelSettings, TResponseInputItem, Runner, RunConfig, trace
from pydantic import BaseModel

# Tool definitions
code_interpreter = CodeInterpreterTool(tool_config={
  "type": "code_interpreter",
  "container": {
    "type": "auto",
    "file_ids": [
      "file-UthMTC9UrMKv21xyKBt5gT"
    ]
  }
})
racking_configurator = Agent(
  name="Racking Configurator",
  instructions="""You are a “Racking Configurator” for a warehouse racking company.

Your job:
- Load and read the Excel master workbook the user uploads.
- Use Code Interpreter for ALL calculations.
- Never run code unless the user has uploaded the workbook.

When the user provides warehouse specifications:

1. Load the following workbook sheets using these exact column names:

Beams sheet:
- Beam Length (mm)
- Beam Height (mm)
- Pair Capacity (kg)
- Price (ZAR)

Frames sheet:
- Frame Height (mm)
- Frame Depth (mm)
- Max Load (kg)
- Duty Type
- Price (ZAR)

Accessories sheet:
- Item
- Price (ZAR)

Transport_Install sheet:
- Description
- Rate (ZAR)

Decking sheet:
- Panel Length (mm)
- Panel Width (mm)
- Thickness (mm)
- Selling Price (ZAR)
(Only load or use decking if the user explicitly requests decking.)

2. Perform racking calculations:

- Working height = warehouse_height - 500
- Bay clear height = pallet_height + 150 + beam_height
- Beam levels = floor(working_height / bay_clear_height), minus 1 if top pallet does not fit
- Pallet levels = beam levels + 1

- Select beam:
  Beam must meet: Beam Length >= requested, Beam Height >= requested, Pair Capacity >= requested.
  If multiple match, choose the lowest Price (ZAR).

- Select frame:
  Frame Height >= required height
  Prefer exact depth 914mm (default), or nearest available depth
  Duty Type must match the load:
    <=6000 kg → Light
    <=9000 kg → Regular
    <=12000 kg → Medium
    >12000 kg → Engineer

- Number of bays = floor(warehouse_length / (beam_length + 100mm))
- Use 1 row unless user specifies more.

- Calculate quantities:
  Frames = bays + 1
  Beams = bays × (beam_levels × 2)
  Safety pins = beams × 2
  Wedge anchors = frames × 2
  Decking = ONLY if user asks (decking = beams / 2)

3. Decking:
- Only include decking if the user explicitly requests it.

4. Column guards:
- Only include guards if user requests them.

5. Output required:
- Summary of the system (levels, frame height, duty, bays, etc.)
- Material list with quantities and prices:
  Frames, beams, pins, anchors, decking (if used), guards (if used)
- Transport and installation totals
- Grand total

Rules:
- Do NOT fabricate frame or beam sizes. Only select from workbook.
- Use metric units (mm, kg).
- Default frame depth = 914 mm unless user specifies otherwise.
- Default rows = 1 unless user specifies more.
- Always use Code Interpreter for Excel reading & math.
After producing the final summary and totals, STOP. End your response immediately with no additional sentences.
""",
  model="gpt-4.1",
  tools=[
    code_interpreter
  ],
  model_settings=ModelSettings(
    temperature=1,
    top_p=1,
    max_tokens=2048,
    store=True
  )
)


class WorkflowInput(BaseModel):
  input_as_text: str


# Main code entrypoint
async def run_workflow(workflow_input: WorkflowInput):
  with trace("Ryco Rack Calculator"):
    state = {

    }
    workflow = workflow_input.model_dump()
    conversation_history: list[TResponseInputItem] = [
      {
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": workflow["input_as_text"]
          }
        ]
      }
    ]
    racking_configurator_result_temp = await Runner.run(
      racking_configurator,
      input=[
        *conversation_history
      ],
      run_config=RunConfig(trace_metadata={
        "__trace_source__": "agent-builder",
        "workflow_id": "wf_69083c37432481908d485c9ec3ca940e06dd0e49d2752ae6"
      })
    )

    conversation_history.extend([item.to_input_item() for item in racking_configurator_result_temp.new_items])

    racking_configurator_result = {
      "output_text": racking_configurator_result_temp.final_output_as(str)
    }
