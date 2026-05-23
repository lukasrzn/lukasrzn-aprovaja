import { Link } from "wouter";
import { motion } from "framer-motion";
import { Zap, FileText, ChevronRight, Mail, ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    id: "aceitacao",
    title: "1. Aceitação dos Termos",
    content: [
      "Ao acessar, criar uma conta ou utilizar qualquer funcionalidade da plataforma AprovaJá, você declara que leu, compreendeu e concorda integralmente com estes Termos de Serviço e com nossa Política de Privacidade.",
      "Se você não concordar com qualquer parte destes termos, não deverá utilizar a plataforma. O uso continuado após alterações nos termos constitui aceitação das mudanças.",
      "Estes Termos constituem um contrato legalmente vinculante entre você ('Usuário') e a AprovaJá Educacional ('AprovaJá', 'nós', 'nosso'), regido pelas leis da República Federativa do Brasil.",
    ],
  },
  {
    id: "descricao",
    title: "2. Descrição da Plataforma",
    content: [
      "O AprovaJá é uma plataforma SaaS (Software as a Service) educacional voltada para a preparação de estudantes para o Exame Nacional do Ensino Médio (ENEM), vestibulares e concursos públicos.",
      "Nossos serviços incluem, mas não se limitam a:",
    ],
    list: [
      "Plano de estudos personalizado gerado por Inteligência Artificial.",
      "Simulados no estilo ENEM com análise de desempenho por área de conhecimento.",
      "Laboratório de Redação com correção automática pelas 5 competências do ENEM via IA.",
      "Sistema de Flashcards com algoritmo de repetição espaçada (SM-2).",
      "Gamificação: XP, níveis, streaks diários, medalhas e ranking nacional.",
      "Professor IA disponível 24/7 para esclarecimento de dúvidas pedagógicas.",
      "Missões diárias e recomendações personalizadas de estudo.",
    ],
  },
  {
    id: "responsabilidades",
    title: "3. Responsabilidades do Usuário",
    content: [
      "Ao utilizar o AprovaJá, você se compromete a:",
    ],
    list: [
      "Fornecer informações verdadeiras, completas e atualizadas no momento do cadastro.",
      "Manter a confidencialidade de suas credenciais de acesso (e-mail e senha). Você é responsável por todas as atividades realizadas sob sua conta.",
      "Utilizar a plataforma exclusivamente para fins educacionais lícitos e pessoais.",
      "Não compartilhar sua conta com terceiros, nem permitir que outras pessoas a utilizem.",
      "Não praticar qualquer forma de engenharia reversa, cópia, reprodução ou distribuição não autorizada do conteúdo da plataforma.",
      "Não utilizar ferramentas automatizadas, bots ou scripts para acessar ou extrair dados da plataforma.",
      "Não submeter conteúdo ofensivo, ilegal, difamatório ou que viole direitos de terceiros nas redações ou interações com o Professor IA.",
      "Notificar imediatamente o suporte em caso de suspeita de acesso não autorizado à sua conta.",
    ],
  },
  {
    id: "assinatura",
    title: "4. Assinatura e Pagamentos",
    content: [
      "O AprovaJá opera exclusivamente no modelo de assinatura paga. Não existe plano gratuito ou acesso sem assinatura ativa.",
    ],
    list: [
      "Plano Pro (R$ 29,90/mês): acesso a simulados ilimitados, flashcards, plano de estudos com IA, gamificação completa e 2 correções de redação por mês.",
      "Plano Premium (R$ 59,90/mês): inclui todos os recursos do Pro, além de redações ilimitadas, Professor IA 24/7, simulados inéditos semanais e métricas avançadas.",
      "O pagamento é processado de forma recorrente (mensal) através de gateway de pagamento certificado. O AprovaJá não armazena dados de cartão de crédito.",
      "A assinatura é renovada automaticamente ao final de cada ciclo, salvo cancelamento expresso pelo usuário antes da data de renovação.",
      "O acesso à plataforma é imediato após a confirmação do pagamento.",
      "Cancelamentos solicitados até 7 (sete) dias após a cobrança podem ser reembolsados integralmente, conforme o Código de Defesa do Consumidor (CDC — Art. 49).",
      "Após o período de 7 dias, não haverá reembolso proporcional pelo período não utilizado.",
      "Em caso de inadimplência, o acesso à plataforma será suspenso até a regularização do pagamento.",
    ],
  },
  {
    id: "propriedade",
    title: "5. Propriedade Intelectual",
    content: [
      "Todo o conteúdo disponibilizado na plataforma AprovaJá é protegido por direitos autorais e propriedade intelectual:",
    ],
    list: [
      "Questões, simulados, textos pedagógicos, algoritmos de IA e interface gráfica são de propriedade exclusiva da AprovaJá Educacional.",
      "É expressamente proibida a reprodução, distribuição, venda, sublicenciamento ou criação de obras derivadas sem autorização prévia por escrito.",
      "O conteúdo gerado pela IA em resposta às interações do usuário (feedbacks de redação, planos de estudo, respostas do Professor IA) é fornecido sob licença de uso pessoal e não transferível.",
      "O usuário retém os direitos autorais sobre os textos por ele redigidos e enviados para correção, concedendo ao AprovaJá licença limitada para processamento e geração de feedback.",
      "A violação desta cláusula pode resultar no encerramento imediato da conta e nas medidas legais cabíveis.",
    ],
  },
  {
    id: "encerramento",
    title: "6. Suspensão e Encerramento de Conta",
    content: [
      "O AprovaJá reserva-se o direito de suspender ou encerrar contas nas seguintes situações:",
    ],
    list: [
      "Violação de qualquer disposição destes Termos de Serviço.",
      "Uso indevido, fraudulento ou abusivo da plataforma.",
      "Tentativas de acesso não autorizado a dados de outros usuários.",
      "Inadimplência não sanada dentro do prazo estabelecido.",
      "Solicitação do próprio usuário (direito ao esquecimento, conforme LGPD).",
      "O usuário pode solicitar o encerramento da conta a qualquer momento pelo e-mail cttvertice@gmail.com. Após confirmação, os dados serão eliminados de acordo com nossa Política de Privacidade.",
      "O AprovaJá não se responsabiliza por perda de progresso, dados ou conteúdo em caso de encerramento por violação dos termos.",
    ],
  },
  {
    id: "limitacoes",
    title: "7. Limitações de Responsabilidade",
    content: [
      "O AprovaJá é uma plataforma de apoio educacional. Ao utilizá-la, o usuário reconhece que:",
    ],
    list: [
      "O AprovaJá não garante a aprovação em exames, concursos ou vestibulares. Os resultados dependem do esforço, dedicação e condições individuais de cada estudante.",
      "Os conteúdos gerados por IA (correções, recomendações, planos de estudo) são ferramentas pedagógicas de apoio e não substituem orientação profissional de professores habilitados.",
      "O AprovaJá não se responsabiliza por eventuais imprecisões nos conteúdos gerados por IA, interrupções no serviço decorrentes de manutenção ou falhas de infraestrutura.",
      "Em nenhuma hipótese a responsabilidade total do AprovaJá perante o usuário excederá o valor pago pelo usuário nos últimos 3 (três) meses de assinatura.",
      "O AprovaJá não se responsabiliza por danos indiretos, incidentais, especiais ou consequentes decorrentes do uso ou impossibilidade de uso da plataforma.",
    ],
  },
  {
    id: "modificacoes",
    title: "8. Modificações nos Termos",
    content: [
      "O AprovaJá pode atualizar estes Termos de Serviço a qualquer momento, a seu exclusivo critério.",
      "Alterações significativas serão comunicadas com antecedência mínima de 15 (quinze) dias por e-mail ou notificação dentro da plataforma.",
      "O uso continuado da plataforma após a data de vigência das novas condições constitui aceitação tácita das alterações.",
      "Caso o usuário não concorde com as novas condições, deverá encerrar sua conta antes da data de vigência.",
      "A versão mais atualizada dos Termos estará sempre disponível em: aprovaja.com.br/termos-de-servico",
      "Última atualização: maio de 2026.",
    ],
  },
  {
    id: "contato",
    title: "9. Foro e Contato",
    content: [
      "Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de domicílio do usuário para dirimir quaisquer controvérsias decorrentes deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.",
      "Para dúvidas, suporte, reclamações ou solicitações relacionadas a estes Termos, entre em contato:",
      "E-mail: cttvertice@gmail.com",
      "Prazo de resposta: até 5 (cinco) dias úteis a partir do recebimento.",
    ],
  },
];

export default function TermosDeServico() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBIMVYxSDBaTTIgMEgzVjFIMlpNMSAxSDJWMkgxWk0zIDFINFYySDNaTTAgMkgxVjNIMFpNMiAySDNWM0gyWk0xIDNIMlY0SDFaTTMgM0g0VjRIM1oiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] pointer-events-none opacity-[0.025]" />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">AprovaJá</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao início
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent mb-4">
            <FileText className="w-3 h-3" /> Termos Legais · Versão 1.0
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Termos de Serviço
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Condições gerais de uso da plataforma AprovaJá. Leia com atenção antes de criar sua conta ou utilizar nossos serviços.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/60">
            <span>Última atualização: maio de 2026</span>
            <span>·</span>
            <span>Vigência: imediata</span>
          </div>
        </motion.div>

        {/* Quick nav */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Índice</p>
          <ul className="space-y-1.5">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-accent/40 group-hover:text-accent transition-colors" />
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section, i) => (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 md:p-8 scroll-mt-20"
            >
              <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>
              <div className="space-y-3">
                {section.content.map((para, j) => (
                  <p key={j} className="text-muted-foreground leading-relaxed text-sm">{para}</p>
                ))}
                {section.list && (
                  <ul className="mt-3 space-y-2">
                    {section.list.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-2 shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 rounded-2xl border border-accent/20 bg-accent/[0.06] p-6 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">Dúvidas sobre os Termos?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Entre em contato: <a href="mailto:cttvertice@gmail.com" className="text-accent hover:underline">cttvertice@gmail.com</a></p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/50">
          <p>© {new Date().getFullYear()} AprovaJá Educacional. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link href="/termos-de-servico" className="hover:text-white transition-colors">Termos de Serviço</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
