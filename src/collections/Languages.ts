import { CollectionConfig } from "payload/types";

export const Languages: CollectionConfig = {
  slug: "languages",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "locale"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: { hidden: true },
    },
    {
      name: "locale",
      type: "text",
      required: true,
      admin: { readOnly: true },
    },
    {
      name: "data",
      type: "json",
      required: true,
    },
  ],
};
