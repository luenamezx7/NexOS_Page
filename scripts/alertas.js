require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parse');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function enviarAlertas(csvPath) {
  const stream = fs.createReadStream(csvPath);
  const parser = csv.parse({ columns: true, trim: true });

  for await (const row of parser) {
    if (row.alerta === 'true' || row.alerta === '1') {
      const destinatario = row.email;
      const assunto = `Alerta de Bio Links - ${row.id}`;
      const mensagem = `
        Olá,

        Este é um alerta gerado pelo script de bio links.

        Detalhes:
        - ID: ${row.id}
        - Email: ${destinatario}
        - Data: ${new Date().toISOString()}

        Atenciosamente,
        Equipe de Bio Links
      `;

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: destinatario,
          subject: assunto,
          text: mensagem,
        });
        console.log(`Alerta enviado para ${destinatario}`);
      } catch (err) {
        console.error(`Falha ao enviar alerta para ${destinatario}:`, err);
      }
    }
  }
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Uso: node scripts/alertas.js <caminho-do-csv>');
  process.exit(1);
}

enviarAlertas(csvPath).catch(err => {
  console.error('Erro ao processar CSV:', err);
  process.exit(1);
});