import { CollectionConfig } from "payload/types";
import softReq from "../utils/requestApi";
import crypto from 'crypto';

const Orders: CollectionConfig = {
  slug: "orders",
  access: {
    read: () => true,
    update: () => true,
    create: () => true,
    delete: () => true,
  },
  //here you can create your custom endpoint
  //your url path look like this ("your-host-name.com/api/collection-slug/endpoints-path")
  //example ("http://localhost:4000/api/orders/payment")
  endpoints: [
    //all this endpoints array is express js code so you can use anything from express js.
    {
      path: "/payment", //path could be anything
      method: "post", //'get', 'head', 'post', 'put', 'delete', 'connect' or 'options' all from express js
      handler: async (req, res, next) => {
        if (req.body.status === "working") {
          //here your cardDetail or anything data you send from frontend
          const {cardDetails, delivery, phone, total, user} = req.body.data
          const {email , name , id} = user ;
          const {address, city, country , state, zipcode} = user.shippingAddress[0]

          const result = decryptSensetiveData(cardDetails);
          const jsonResult = JSON.parse(result)
          const {number, cvc, expiry, focus } = jsonResult ;
          const userInfo = {
            id,
            name,
            email,
            city,
            country,
            state,
            zipcode,
            number,
            cvc,
            expiry,
            focus,
            phone,
            address,
            total
          }
          const resultPayment = await softReq(userInfo);
          if(resultPayment){
            res.status(200).send({ ...req.body });
          }else{
            res.status(400).send({ error: "something wrong" });
          }
        } else {
          res.status(400).send({ error: "something wrong" });
        }
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req, previousDoc }) => {
        if (operation === "create") {
          let user = await req.payload.findByID({
            collection: doc.orderBy.relationTo,
            id: doc.orderBy.value,
          });
          await req.payload.sendEmail({
            to: user.email,
            from: process.env.SMTP_USER,
            subject: "Order Confirmation",
            html: `<h1>Thank you for your order!</h1>
              <p>Here is your order summary:</p>
              <ul>
                ${doc.cart.map(
                  (item) => `<li>${item.name} - ${item.price}</li>`
                )}
              </ul>
              <p>Total: ${doc.total}</p>
            `,
          });
        }
        if (operation === "update" && doc.status !== 0) {
          let user = await req.payload.findByID({
            collection: doc.orderBy.relationTo,
            id: doc.orderBy.value,
          });
          if (doc.status !== previousDoc.status) {
            await req.payload.sendEmail({
              to: user.email,
              from: process.env.SMTP_USER,
              subject: "Order Status Information",
              html: `<h1>Your order status has been updated</h1>
                   <p>Current order status:${
                     doc.status === "1"
                       ? "Shipped"
                       : doc.status === "2"
                       ? "Out of Delivery"
                       : doc.status === "3"
                       ? "Delivered"
                       : doc.status === "4"
                       ? "Canceled"
                       : "Refund"
                   }</p>
                  `,
            });
          }
        }
      },
    ],
  },
  fields: [
    {
      name: "orderBy",
      type: "relationship",
      relationTo: ["users", "googleUsers"],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "0",
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "Order Confirm", value: "0" },
        { label: "Shipped", value: "1" },
        { label: "Out of Delivery", value: "2" },
        { label: "Delivered", value: "3" },
        { label: "Canceled", value: "4" },
        { label: "Refund", value: "5" },
      ],
    },
    {
      name: "address",
      type: "text",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "trackId",
      type: "text",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "cart",
      type: "array",
      fields: [
        {
          name: "productImage",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "sourceImage",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "price",
          type: "number",
          required: true,
        },
        {
          name: "quantity",
          type: "number",
        },
        {
          name: "printOnBothSide",
          type: "checkbox",
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: "discount",
      type: "number",
    },
    {
      name: "delivery",
      type: "number",
    },
    {
      name: "tax",
      type: "number",
    },
    {
      name: "total",
      label: "Total Price",
      type: "number",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "deliveryDate",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayOnly",
          displayFormat: "d MMM yyy",
        },
      },
    },
    {
      name: "shippedDate",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayOnly",
          displayFormat: "d MMM yyy",
        },
      },
    },
    {
      name: "outOfDeliveryDate",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayOnly",
          displayFormat: "d MMM yyy",
        },
      },
    },
  ],
};

function decryptSensetiveData(encryptedData){

  const privateKey = private_key();
  const jsonEncryptedData = JSON.parse(encryptedData);
  const buffer = Buffer.from(jsonEncryptedData.encryptedData, 'base64'); // Decode base64

  // Decrypt using the private key
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase: 'Hanna12345', // If you set a passphrase during key generation
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  );
  return decrypted.toString('utf8');
}

function private_key(){
  const privateKey = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFHzBJBgkqhkiG9w0BBQ0wPDAbBgkqhkiG9w0BBQwwDgQIKwtH8ixqX8MCAggA
MB0GCWCGSAFlAwQBKgQQcgMy6owLw8zl7/jnW+ESqgSCBNAK485Senx7llJtKLZP
weeLNVupnox+sSGsyf9PFlud/pUd7Xo8aog09BE58TYbAuZqkvWf66SEnnURY9OF
6QDfLfFKaPbhxHPaqMQQLDZyN3HOyIvt+FISJqPsNERIeD5EQgPxU5mARrD23wQv
anekwBT81CsO2HBnuHcvBkptZKdjVgJlsTbX4Bhf6M/6AtWuK7ZcozqSyx6qHF7g
IAW69sRm8OB8Lr2pUzweVw+fKrVUW/nJGjqawjQkZSRQ7ZdH21S9uAKRfW5PIBpz
j0rpozJcYZG8yPOhdhIhckTEQSYA6gruoZ1zRGIDfzOJgP2sSXFEYlYk3CiaGRS6
lpPwl7vnKUJPiWrhp9b3/Ywb5PcXN/5sy4tzMU77JAVAigQBFEnycsavj7C56Rq6
/+CjjVLpee9jcefOpmw9DCdaFodT3UtsyuJNwLPW7cCv2mZKCgHeCNnCAlDrXxEG
qvsGbDycoC9+EvJX5TMrs9CMVxrm7hqCvNZ82x4ccCPeYqLEk/kguhZIk94UJTEh
37gMMYAQu5k9yg5yLuQ/cC3qZQQZ36TchSU8K2KWZBIh2Wcjd0LdqhbB0NuwiG1m
suE/wnzHeiABYegxpGdSOFV1ALUatiSBzEkJv8eDc01n2Bz6nTC243/5Sd5urZkm
5p0m/wlL0rNePyEOTRItBa8XU490WqKhQFFT1EBpIQYhTfFw5npwmeiwFPtSFbZp
vCN2dU/WLKYUBhkEiOA0kAoqEAdc+fBx8MY2M4ls2vrF2V2QpSfRMP5Y+OfIqjwq
mHL/nmD8Lt8S9grl/sQ1rtkrWY4tXhJ+tbNLIqRRBVEIBw5T/10yQCJn40V9o6It
bckcqCW1UCqr1O97LtHgAoZQVafFm1SwLvqD1Dx9+/uCR+0+UyOXNl7SepV0vr4A
YxON5qPMKco5Rkg10w3Zautf7bZ9cDJth92m42Aijqi5fKI8GvAdg4a3L3qarBI2
J2Ga9SxGRUBTH40yxKuBMl1hr94cNU1wuwBlNyZdZeyE1yJ7Wco6RUqYzb8n1DtI
ClZfbXrsJATEcDpAJO9UZRxr04OboA4oQLzxpf+vRUEdEQSUbl6abeWVfzgKouYu
5Pm6bxZMPyqCp9qI3Ndvn16Utiu8E9a1ZcpHgo3eXL84PwfN1dHQLRqeEzxJRiT+
rZiUeBlcVM9rJlIyNWrnmwUIlqOV15hr4HlDHJfDRFYS7R23WzzVMmTtWT05nUjJ
fXRKRKjIyDGHsvPzYJBm9/inke8Cd6Qw21RQKO98ZnegEN/FF3jRiGpbEohzIul5
E2AQt0E+LE8vCZbPGTpCu8ePm1kDGm/tae0bCjePm5vwsyvSXjBvdFqXU+qbZPbH
blSrp1Gp3i61otnYfwViCeYBuBZuqgp2CNJpcbR9yw0H7herWzU8nxOydc2dmyWj
195IRvT9fhLp9fPca8KKTnJEXUX0hw4riokdB/Vg4U65JaqI5eoB7Mth+fz1Zio1
qxUiKI6SldR6JAtSElBNylswU0bLygfO0lT+3bl/TBxLa/+xhTQOtyECd1cfAHV6
xFRYMNGqiF/CETTVTTmVKsIV/VnpKjcuoF8Ug0n/jBrtdklC1UI3tcK+dI2k2CU9
BRYBupDrkEVHZzGMNHuEP7SoPQ==
-----END ENCRYPTED PRIVATE KEY-----
`;
  return privateKey ;
}


export default Orders;
