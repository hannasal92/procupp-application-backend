import { CollectionConfig } from "payload/types";

const Users: CollectionConfig = {
  slug: "users",
  auth: {
    verify: {
      generateEmailHTML: ({ req, token, user }) => {
        // Use the token provided to allow your user to verify their account
        const url = `${process.env.FRONTEND_URL}/verify?token=${token}`;

        return `Hey ${user.email}, verify your email by clicking here: ${url}`;
      },
    },
    forgotPassword: {
      generateEmailHTML: ({ req, token, user }) => {
        // Use the token provided to allow your user to reset their password
        const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        return `
          <!doctype html>
          <html>
            <body>
              <h1>Here is my custom email template!</h1>
              <p>Hello, ${(user as any).email}!</p>
              <p>Click below to reset your password.</p>
              <p>
                <a href="${resetPasswordURL}">${resetPasswordURL}</a>
              </p>
            </body>
          </html>
        `;
      },
    },
  },
  access: {
    read: () => true,
    update: () => true,
    create: () => true,
    delete: () => true,
  },
  admin: {
    useAsTitle: "email",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "profile",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "shippingAddress",
      type: "array",
      fields: [
        {
          name: "address",
          type: "text",
        },
        {
          type: "row",
          fields: [
            {
              name: "country",
              type: "text",
            },
            {
              name: "zipcode",
              type: "text",
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "city",
              type: "text",
            },
            {
              name: "state",
              type: "text",
            },
          ],
        },
        {
          name: "phone",
          type: "text",
        },
      ],
    },
  ],
};

export default Users;
