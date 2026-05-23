import { Link } from "wouter";
import { motion } from "framer-motion";
import { Zap, Shield, ChevronRight, Mail, ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    id: "introducao",
    title: "1. Introdução",
    content: [
      "A AprovaJá Educacional ('AprovaJá', 'nós', 'nosso') leva a privacidade dos seus usuários muito a sério. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nossa plataforma educacional.",
      "Ao criar uma conta ou utilizar qualquer recurso do AprovaJá, você concorda com as práticas descritas nesta política. Recomendamos a leitura completa antes de usar nossos serviços.",
      "Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis à proteção de dados pessoais no Brasil.",
    ],
  },
  {
    id: "dados-coletados",
    title: "2. Dados Coletados",
    content: [
      "Coletamos apenas os dados necessários para fornecer uma experiência de aprendizado personalizada e eficiente. As categorias de dados incluem:",
    ],
    list: [
      "Dados de cadastro: nome completo, endereço de e-mail, senha (armazenada em formato hash seguro) e objetivo de estudo.",
      "Dados de desempenho acadêmico: resultados de simulados, pontuação por competência nas redações, histórico de acertos e erros por área de conhecimento.",
      "Dados de uso da plataforma: flashcards revisados, tempo de estudo diário, frequência de acesso, páginas visitadas e funcionalidades utilizadas.",
      "Dados de gamificação: pontuação de XP, nível, sequência de dias (streak), medalhas conquistadas e posição no ranking.",
      "Dados de redação: textos enviados para correção e os respectivos feedbacks gerados pelo sistema de inteligência artificial.",
      "Dados do dispositivo: tipo de navegador, sistema operacional, endereço IP e dados de sessão para segurança e personalização.",
    ],
  },
  {
    id: "uso-dos-dados",
    title: "3. Como Utilizamos seus Dados",
    content: [
      "Utilizamos seus dados exclusivamente para os fins descritos abaixo, sempre buscando melhorar sua experiência de aprendizado:",
    ],
    list: [
      "Personalização do Plano de Estudos: a IA analisa seu histórico de desempenho para gerar cronogramas adaptativos às suas necessidades.",
      "Recomendações Inteligentes: sugestão de conteúdos, questões e flashcards com base nas suas áreas de maior dificuldade.",
      "Acompanhamento de Progresso: exibição de métricas de evolução, gráficos de desempenho e relatórios periódicos.",
      "Gamificação e Engajamento: cálculo de XP, streaks, rankings e conquistas (medalhas) para incentivar a consistência nos estudos.",
      "Correção de Redação por IA: análise do texto enviado pelas 5 competências do ENEM e geração de feedback detalhado.",
      "Comunicação: envio de notificações sobre missões diárias, conquistas desbloqueadas e informações sobre sua conta.",
      "Segurança: detecção de acessos suspeitos, prevenção de fraudes e proteção da integridade da plataforma.",
    ],
  },
  {
    id: "armazenamento",
    title: "4. Armazenamento e Segurança",
    content: [
      "A segurança dos seus dados é uma prioridade. Adotamos as seguintes medidas técnicas e organizacionais:",
    ],
    list: [
      "Armazenamento em banco de dados PostgreSQL com criptografia em repouso e em trânsito (TLS/SSL).",
      "Senhas nunca são armazenadas em texto claro — utilizamos algoritmos de hash criptográfico seguros (bcrypt).",
      "Acesso restrito aos dados: apenas membros autorizados da equipe AprovaJá têm acesso aos dados de produção.",
      "Backups regulares com retenção controlada para recuperação em caso de falhas.",
      "Monitoramento contínuo contra acessos não autorizados e atividades suspeitas.",
      "Revisões periódicas de segurança e atualização de dependências para mitigar vulnerabilidades conhecidas.",
    ],
  },
  {
    id: "terceiros",
    title: "5. Serviços de Terceiros",
    content: [
      "Para oferecer nossas funcionalidades, utilizamos alguns serviços de parceiros tecnológicos confiáveis:",
    ],
    list: [
      "OpenAI API: utilizada para geração de conteúdo educacional personalizado, correção de redações e recomendações pedagógicas. Os textos enviados são processados conforme a política de privacidade da OpenAI e não são usados para treinar modelos sem consentimento.",
      "Processadores de pagamento: as transações financeiras são processadas por gateways certificados com PCI-DSS. O AprovaJá não armazena dados de cartão de crédito.",
      "Infraestrutura de nuvem: utilizamos servidores em nuvem com altos padrões de segurança e disponibilidade para hospedar nossa plataforma.",
      "Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins de marketing ou publicidade.",
    ],
  },
  {
    id: "direitos",
    title: "6. Seus Direitos (LGPD)",
    content: [
      "Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você possui os seguintes direitos em relação aos seus dados pessoais:",
    ],
    list: [
      "Acesso: solicitar uma cópia de todos os dados pessoais que temos sobre você.",
      "Correção: corrigir dados incompletos, inexatos ou desatualizados diretamente nas configurações da conta.",
      "Exclusão: solicitar a exclusão dos seus dados pessoais, exceto quando a retenção for exigida por lei.",
      "Portabilidade: receber seus dados em formato estruturado e legível por máquina.",
      "Revogação de consentimento: retirar seu consentimento para o tratamento de dados a qualquer momento.",
      "Oposição: opor-se ao tratamento de dados em determinadas situações previstas em lei.",
      "Para exercer qualquer destes direitos, entre em contato pelo e-mail: cttvertice@gmail.com",
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies e Rastreamento",
    content: [
      "Utilizamos cookies e tecnologias similares para garantir o funcionamento adequado da plataforma e melhorar sua experiência:",
    ],
    list: [
      "Cookies essenciais: necessários para autenticação e segurança da sessão. Não podem ser desativados.",
      "Cookies de desempenho: coletam dados anônimos sobre como você interage com a plataforma para identificarmos melhorias.",
      "Armazenamento local (localStorage/sessionStorage): utilizado para manter preferências de interface e estado temporário da sessão.",
      "Não utilizamos cookies de rastreamento para fins publicitários ou de perfil comportamental externo.",
      "Você pode configurar seu navegador para bloquear cookies, mas isso pode impactar a funcionalidade da plataforma.",
    ],
  },
  {
    id: "contato",
    title: "8. Contato e DPO",
    content: [
      "Para dúvidas, solicitações ou exercício dos seus direitos previstos na LGPD, entre em contato com nossa equipe:",
      "E-mail de suporte e privacidade: cttvertice@gmail.com",
      "Prazo de resposta: até 15 (quinze) dias úteis a partir do recebimento da solicitação.",
      "Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos os usuários sobre alterações significativas por e-mail ou notificação na plataforma. A versão mais recente estará sempre disponível nesta página.",
      "Última atualização: maio de 2026.",
    ],
  },
];

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Subtle grid background */}
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4">
            <Shield className="w-3 h-3" /> Proteção de Dados · LGPD
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Transparência total sobre como coletamos, usamos e protegemos seus dados pessoais na plataforma AprovaJá.
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
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary transition-colors" />
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
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
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
          className="mt-10 rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">Dúvidas sobre privacidade?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Entre em contato: <a href="mailto:cttvertice@gmail.com" className="text-primary hover:underline">cttvertice@gmail.com</a></p>
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
