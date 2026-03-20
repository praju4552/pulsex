import os

def append_payment():
    path = r"d:\pulsex(prototyping)\backend-node\prisma\schema.prisma"
    if not os.path.exists(path): return False
    
    with open(path, 'r', encoding='utf-8') as f:
         content = f.read()

    new_model = """
model Payment {
  id                String   @id @default(cuid())
  razorpayOrderId   String   @unique
  razorpayPaymentId String?
  razorpaySignature String?
  amount            Int
  currency          String   @default("INR")
  status            String   @default("CREATED")
  orderType         String
  orderIds          Json
  userId            String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
"""
    if "model Payment" not in content:
         content += new_model
         with open(path, 'w', encoding='utf-8') as f:
              f.write(content)
         print("✅ Payment model appended to schema.prisma")
         return True
    return False

append_payment()
