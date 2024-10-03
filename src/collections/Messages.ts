import { CollectionConfig } from "payload/types";

const Messages: CollectionConfig = {
  slug: "messages",
  admin: {
    useAsTitle: "name",
  },
  access: {
    create: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === "create") {
          await req.payload.sendEmail({
            to: "info@worldprint.com",
            from: process.env.SMTP_USER,
            subject: "Customer Message",
            html: `
                        <table style="font-family:system-ui; width:100%;">
                          <tr>
                            <th style="text-align:center;" colspan="2">Message Information</th>
                          </tr>
                          <tr>
                            <td>Name</td>
                            <td>${doc.name}</td>
                          </tr>
                          <tr>
                            <td>Email</td>
                            <td>${doc.email}</td>
                          </tr>
                          <tr>
                            <td>Phone</td>
                            <td>${doc.phone}</td>
                          </tr>
                          <tr>
                            <td>City</td>
                            <td>${doc.city}</td>
                          </tr>
                          <tr>
                            <td>Message</td>
                            <td>${doc.message}</td>
                          </tr>
                        </table>
                `,
          });
        }
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
    },
    {
      name: "city",
      type: "text",
      required: true,
    },
    {
      name: "message",
      type: "text",
    },
  ],
};

export default Messages;
