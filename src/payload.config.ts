import path from "path";

import { payloadCloud } from "@payloadcms/plugin-cloud";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import { slateEditor } from "@payloadcms/richtext-slate";
import { buildConfig } from "payload/config";

import Users from "./collections/Users";
import Media from "./collections/Media";
import Orders from "./collections/Orders";
import GoogleLoginButton from "./components/GoogleLoginButton";
import Messages from "./collections/Messages";
import GoogleUsers from "./collections/GoogleUsers";
import { Languages } from "./collections/Languages";

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    // components: {
    //   afterLogin: [GoogleLoginButton],
    // },
  },
  cors: "*",
  editor: slateEditor({}),
  collections: [Users, GoogleUsers, Media, Orders, Messages, Languages],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  plugins: [payloadCloud()],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
});
