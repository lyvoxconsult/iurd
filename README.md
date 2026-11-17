# IURD U Marizal • Sistema de Gestão e Pontuação do Rali

Sistema web responsivo para gestão do rali da igreja IURD U Marizal.

> **Estado da hospedagem:** o projeto Firebase `iurd-u-marizal` e o Firestore `(default)` em `southamerica-east1` foram criados. As rotas da aplicação ainda usam Prisma/SQLite. Não publique esta versão na Vercel para registrar pontos: o SQLite local não é persistente nas funções da Vercel. A integração com Firestore e a migração verificada dos dados são etapas pendentes.

---

## 📌 Contexto e Regras de Negócio

### 1. Estrutura Organizacional
- **2 Nações**: Nação Judá (Âmbar/Dourado) e Nação Benjamim (Azul/Ciano).
- **12 Tribos**: Cada nação possui exatamente 6 tribos vinculadas.
  - **Judá**: Tribo Leão, Tribo Guerreiros, Tribo Vencedores, Tribo Conquistadores, Tribo Aliança, Tribo Firmeza.
  - **Benjamim**: Tribo Águia, Tribo Valentes, Tribo Sentinela, Tribo Chama, Tribo Rocha, Tribo Redenção.
- **Categorias de Integrantes**: Jovem, Membro, Obreiro, Colaborador.
- **Funções de Integrantes**: Participante, Líder de Tribo, Líder de Nação.
- **Vínculo Estrito**: Uma tribo pertence a exatamente uma nação. No cadastro ou edição, o sistema impede selecionar uma tribo de outra nação tanto no front-end quanto no servidor.

### 2. Semanas e Fuso Horário
- **Fuso Horário Canônico**: `America/Sao_Paulo`.
- **Semana de Pontuação**: Inicia na **segunda-feira (00:00:00)** e encerra no **domingo (23:59:59)**.
- **Placar de Sábado**: No sábado, o placar principal exibe as nações com indicação explícita de que o resultado é **parcial**, pois os lançamentos realizados no domingo ainda somam na mesma semana.
- **Acumulado**: Os pontos semanais se acumulam até o encerramento do rali.

### 3. Mecânica de Desafios
- O administrador cria um desafio com título, descrição opcional e valor em pontos. Também pode registrar um novo desafio durante o lançamento.
- Cada lançamento de um desafio cadastrado usa o valor definido para esse desafio.
- Cada lançamento tem exatamente **um alvo**: Nação, Tribo ou Pessoa.
- O valor do desafio é aplicado **uma única vez** por lançamento (nunca multiplicado por integrantes).
- **Alvo Nação**: Soma **somente à nação**.
- **Alvo Tribo**: Soma à tribo e à sua nação correspondente.
- **Alvo Pessoa**: Soma à tribo e à nação dessa pessoa (com snapshot histórico imutável).
- **Líder pontuando em desafio**: Se a pessoa for líder, o lançamento continua seguindo a regra da pessoa (soma à tribo e à nação) e **não** entra no ranking de líderes.

### 4. Pontos Manuais de Líderes
- Lançamentos manuais pontuais, totalmente independentes dos desafios.
- Exigem a seleção de um líder, valor positivo de pontos e **motivo obrigatório** (ex: *"Líder mais engajado"*).
- Entram **exclusivamente no ranking correspondente** ao tipo do líder (`líder de tribo` ou `líder de nação`).
- **Nunca** alteram o placar da tribo ou da nação.

### 5. Tratamento de Empates
- Empates permanecem rigorosamente empatados com a **mesma colocação** (ex: 1º, 1º, 3º). Não há desempate forçado.

### 6. Integridade e Auditoria
- Todos os placares são derivados exclusivamente de lançamentos persistidos.
- **Sem pontos negativos**: Lançamentos incorretos são corrigidos por meio de **estorno auditado**, que mantém a linha do tempo, registra o motivo da anulação e recalcula automaticamente os rankings sem apagar registros físicos.
- **Snapshot Histórico**: Nações e tribos beneficiadas são gravadas no momento do lançamento, garantindo que transferências posteriores de cadastro não alterem placares do passado.
- **Proteção contra Duplo Clique**: Chaves de idempotência e bloqueio no client/server.

---

## 🛠️ Stack Tecnológica e Justificativa

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript).
- **Estilização**: Tailwind CSS v3 com tema escuro premium e acentos dourados/âmbar (`#f59e0b`).
- **Banco de Dados**: SQLite local persistido em arquivo (`prisma/dev.db`), gratuito, sem dependência de serviços em nuvem ou Docker.
- **ORM & Migrações**: [Prisma ORM](https://www.prisma.io/) com migrações versionadas e tipagem ponta a ponta.
- **Datas e Timezone**: `date-fns` e `date-fns-tz` operando no fuso `America/Sao_Paulo`.
- **Validação de Schemas**: [Zod](https://zod.dev/) no client e nas APIs do servidor.
- **Ícones**: [Lucide React](https://lucide.dev/).

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js v18+ (testado e validado no Node.js v24 no Windows)
- npm v9+

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Acesso administrativo
Copie `.env.example` para `.env` e defina `ADMIN_PASSWORD` (ao menos 12 caracteres) e `SESSION_SECRET` (ao menos 32 caracteres aleatórios). O sistema bloqueia o acesso às APIs enquanto essas variáveis não estiverem configuradas. O arquivo `.env` não deve ser versionado nem compartilhado.

O SQLite atual é local. Para testar em um celular ou tablet, o dispositivo precisa alcançar o computador que executa a aplicação **por HTTPS** (inclusive na rede local), pois a senha e o cookie de sessão não devem trafegar por HTTP. Acesso por `localhost` serve apenas para desenvolvimento no próprio computador. A futura hospedagem na Vercel fornece HTTPS, mas depende da troca do banco antes do uso real.

### 4. Banco de Dados e Migrações
O banco SQLite local é configurado via Prisma:
```bash
# Executa migrações existentes e sincroniza o schema
npx prisma migrate dev
```

### 5. Carga de Dados Iniciais (Seed)
Cria o rali inicial, 2 nações e 12 tribos quando ainda não existem. Não cria pessoas fictícias nem altera o nome de um rali já existente:
```bash
npm run prisma:seed
```

### 6. Executar os Testes Automatizados de Regras de Negócio
```bash
npm run test:rules
```
Execute testes que escrevem no banco somente com `DATABASE_URL` apontando para um banco de teste isolado.

### 7. Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 8. Build e Execução em Produção
```bash
npm run build
npm start
```

---

## 📂 Estrutura do Projeto

```
IURD/
├── prisma/
│   ├── schema.prisma       # Modelagem relacional e integridade
│   ├── migrations/         # Histórico versionado de migrações
│   └── seed.js             # Carga inicial com nações, tribos e desafios
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── challenges/ # CRUD de desafios
│   │   │   ├── history/    # Linha do tempo auditável
│   │   │   ├── nations/    # Consulta de nações e tribos
│   │   │   ├── people/     # Cadastro, consulta e validação estrita
│   │   │   ├── rally/      # Gestão do ciclo de vida dos ralis
│   │   │   ├── rankings/   # Cálculo de rankings semanais e acumulados
│   │   │   ├── scores/     # Lançamentos (desafio, líder, estorno)
│   │   │   └── tribes/     # Consulta de tribos
│   │   ├── globals.css     # Estilos dark theme e gradientes dourados
│   │   ├── layout.tsx      # Template raiz com metadados
│   │   └── page.tsx        # Aplicação SPA modular responsiva
│   ├── components/
│   │   ├── Header.tsx          # Cabeçalho com status da semana parcial
│   │   ├── ScoreModal.tsx      # Modal unificado de lançamento de pontos
│   │   ├── DashboardView.tsx   # Placar principal das 2 Nações
│   │   ├── RankingsView.tsx    # Rankings detalhados com empates mantidos
│   │   ├── PeopleView.tsx      # Gestão de integrantes por nação/tribo
│   │   ├── ChallengesView.tsx  # Gestão de desafios
│   │   ├── LeadersView.tsx     # Painel e histórico individual de líderes
│   │   ├── HistoryView.tsx     # Auditoria e estorno de lançamentos
│   │   └── RallyManageView.tsx # Gestão do rali e histórico de edições
│   └── lib/
│       ├── prisma.ts       # Singleton do Prisma Client
│       ├── scoring.ts      # Fórmulas de pontuação, fuso SP e empates
│       └── validations.ts  # Schemas Zod de validação
├── scripts/
│   ├── test-rules.ts       # Bateria de testes das regras de negócio
│   └── test-api-live.js    # Teste de integração HTTP ponta a ponta
└── package.json
```

---

## 🔒 Auditoria e Segurança
- Nenhuma chave ou segredo exposto no repositório (`.env` devidamente no `.gitignore`).
- Acesso administrativo obrigatório para consultas e alterações de dados.
- Validação de entradas no servidor.
- Estorno sem exclusão física garantindo rastreabilidade contábil total do rali.
- `scripts/reset-for-production.js` apaga pontuações e desafios; permanece bloqueado por padrão e não faz parte da instalação ou atualização normal.
