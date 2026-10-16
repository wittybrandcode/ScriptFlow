export const RuleSchema = {
  type: "object",
  properties: {
    rule_group: { type: "string" },
    target_node: { type: "string" },
    domain: { type: "string" },
    rules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rule_id: { type: "string" },
          name_ar: { type: "string" },
          description: { type: "string" },
          priority: { type: "number" },
          conditions: { type: "array" },
          effect: {
            type: "object",
            properties: {
              type: { type: "string" },
              value: { type: "string" },
              fraction_of_remainder: { type: "string" },
              label: { type: "string" }
            },
            required: ["type"]
          },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                source: { type: "string" },
                text: { type: "string" }
              }
            }
          }
        },
        required: ["rule_id", "priority", "conditions", "effect"]
      }
    }
  },
  required: ["rule_group", "target_node", "rules"]
};
