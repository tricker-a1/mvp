import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.industry.createMany({
    data: [
      { value: 'Accounting' },
      { value: 'Administration & Office Support' },
      { value: 'Advertising, Arts & Media' },
      { value: 'Banking & Financial Services' },
      { value: 'Call Centre & Customer Service' },
      { value: 'Community Services & Development' },
      { value: 'Construction' },
      { value: 'Consulting & Strategy' },
      { value: 'Design & Architechture' },
      { value: 'Education & Training' },
      { value: 'Engineering' },
      { value: 'Farming, Animals & Conservation' },
      { value: 'Government & Defence' },
      { value: 'Healthcare & Medical' },
      { value: 'Hospitality & Tourism' },
      { value: 'Human Resources & Recruitment' },
      { value: 'Information & Communication Technology' },
      { value: 'Insurance & Superannuation' },
      { value: 'Legal' },
      { value: 'Manufacturing, Transport & Logistics' },
      { value: 'Marketing & Communications' },
      { value: 'Mining, Resources & Energy' },
      { value: 'Real Estate & Property' },
      { value: 'Retail & Consumer Products' },
      { value: 'Sales' },
      { value: 'Science & Technology' },
      { value: 'Sport & Recreation' },
      { value: 'Trades & Services' },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
