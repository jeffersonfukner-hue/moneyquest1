import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PublicFooter from '@/components/layout/PublicFooter';
import { useSEO } from '@/hooks/useSEO';
import { 
  PiggyBank, 
  ArrowRight,
  BookOpen,
  Clock
} from 'lucide-react';

const ControleFinanceiro = () => {
  useSEO({
    title: 'Controle Financeiro Pessoal: o Guia Completo para Organizar Seu Dinheiro | MoneyQuest',
    description: 'Aprenda como fazer controle financeiro pessoal de forma prática e sustentável. Guia completo com métodos que funcionam para organizar gastos mensais e transformar sua vida financeira.',
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <PiggyBank className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl">MoneyQuest</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <Link to="/signup">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Article Hero */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Guia Completo
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  12 min de leitura
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Controle Financeiro Pessoal: o Guia Completo para Organizar Seu Dinheiro
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Um método prático e sustentável para quem já tentou organizar as finanças e não conseguiu manter a constância.
              </p>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
              
              {/* Introdução */}
              <p className="lead text-xl text-muted-foreground">
                Você trabalha, recebe seu salário, paga as contas e quando olha para a conta no fim do mês, o dinheiro simplesmente evaporou. Não sobra nada. E o pior: você nem sabe exatamente para onde foi.
              </p>

              <p>
                Essa sensação de descontrole é mais comum do que parece. Milhões de brasileiros vivem assim, mês após mês, tentando planilhas, aplicativos e métodos que prometem milagres, mas abandonam tudo depois de algumas semanas.
              </p>

              <p>
                O problema não é falta de vontade. O problema é que a maioria dos métodos de controle financeiro pessoal foi criada para funcionar no papel, não na vida real. Eles exigem tempo demais, disciplina sobre-humana ou conhecimentos que ninguém ensinou na escola.
              </p>

              <p>
                Este guia foi escrito para mudar isso. Aqui você vai encontrar um caminho prático, simples e sustentável para organizar seu dinheiro de verdade. Sem fórmulas mágicas, sem promessas vazias. Apenas um método que funciona para pessoas reais, com vidas reais e imprevistos reais.
              </p>

              {/* O que é controle financeiro pessoal */}
              <h2 className="text-2xl font-bold mt-12 mb-4">O que é controle financeiro pessoal</h2>
              
              <p>
                Controle financeiro pessoal é, na essência, saber para onde vai cada real que entra na sua vida. É ter clareza sobre suas receitas, despesas e decisões financeiras de forma consciente e intencional.
              </p>

              <p>
                Mas existe uma armadilha aqui. Muitas pessoas confundem controle com privação. Acham que organizar as finanças significa cortar tudo, viver no modo economia extrema e nunca mais aproveitar a vida.
              </p>

              <p>
                Isso não é controle. Isso é punição.
              </p>

              <p>
                O verdadeiro controle financeiro é sobre liberdade. É poder gastar com o que realmente importa para você, sem culpa, porque você sabe que suas contas estão em dia e que existe um plano. É trocar o estresse da incerteza pela tranquilidade de quem sabe exatamente onde está pisando.
              </p>

              <p>
                Quando você domina seu dinheiro, ele trabalha para você. Quando você não domina, você trabalha para ele.
              </p>

              {/* Por que a maioria falha */}
              <h2 className="text-2xl font-bold mt-12 mb-4">Por que a maioria das pessoas falha no controle financeiro</h2>

              <p>
                Antes de falar sobre soluções, precisamos entender por que tantas pessoas tentam e desistem. Conhecer os obstáculos é o primeiro passo para superá-los.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Falta de visibilidade real dos gastos</h3>

              <p>
                O maior inimigo do controle financeiro é a invisibilidade. Pagamentos no cartão, Pix automático, débito em conta, assinaturas esquecidas. O dinheiro sai de formas tão fragmentadas que fica impossível ter uma visão clara do todo.
              </p>

              <p>
                A maioria das pessoas não sabe quanto gastou no último mês. Não sabe qual categoria consome mais dinheiro. Não sabe se está gastando mais ou menos do que três meses atrás. E quando você não vê o problema, não consegue resolver.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Emoção dominando decisões financeiras</h3>

              <p>
                Somos seres emocionais. Compramos por impulso, gastamos para compensar um dia ruim, usamos o consumo como válvula de escape. Isso é humano.
              </p>

              <p>
                O problema é quando essas decisões emocionais acontecem no piloto automático, sem consciência. O controle financeiro não significa eliminar a emoção das compras. Significa criar um espaço entre o impulso e a ação, para que você possa decidir com mais clareza.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Métodos complexos demais</h3>

              <p>
                Planilhas com dezenas de abas. Fórmulas de orçamento com porcentagens precisas. Métodos que exigem horas de dedicação por semana. Tudo isso funciona para quem tem tempo e disposição. Para a maioria das pessoas, funciona por duas semanas e depois vira mais uma aba esquecida no navegador.
              </p>

              <p>
                Complexidade é inimiga da constância. Um sistema que você não consegue manter não é um bom sistema, não importa quão sofisticado seja.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Falta de constância</h3>

              <p>
                Talvez o obstáculo mais subestimado. Controle financeiro não é um evento, é um hábito. Não adianta fazer uma análise profunda das finanças em janeiro e nunca mais olhar para os números até dezembro.
              </p>

              <p>
                O segredo não está em sessões longas e intensas de organização. Está em pequenas ações diárias que se tornam automáticas. Alguns minutos por dia são mais poderosos do que horas uma vez por mês.
              </p>

              {/* Como controlar gastos mensais na prática */}
              <h2 className="text-2xl font-bold mt-12 mb-4">Como controlar gastos mensais na prática</h2>

              <p>
                Teoria é importante, mas sem prática ela não transforma nada. Vamos ao que interessa: como colocar o controle de gastos mensais em ação de forma simples e realista.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Registrar todos os gastos</h3>

              <p>
                O primeiro passo é criar o hábito de registrar. Cada café, cada Uber, cada compra no supermercado. Não para julgar, mas para ver. A maioria das pessoas que começa a registrar seus gastos se surpreende com o que descobre.
              </p>

              <p>
                O registro não precisa ser detalhado. Valor, categoria e uma descrição breve são suficientes. O importante é a constância. Registrar no momento em que o gasto acontece, ou pelo menos no mesmo dia.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Separar gastos fixos e variáveis</h3>

              <p>
                Gastos fixos são aqueles que se repetem todo mês com valores previsíveis: aluguel, contas de luz e água, internet, plano de saúde. Gastos variáveis mudam conforme seu comportamento: alimentação, lazer, compras, transporte.
              </p>

              <p>
                Essa separação é fundamental porque cada tipo de gasto exige uma estratégia diferente. Gastos fixos precisam ser revisados periodicamente para buscar reduções. Gastos variáveis precisam de atenção diária para evitar excessos.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Identificar padrões de consumo</h3>

              <p>
                Depois de algumas semanas registrando, padrões começam a aparecer. Você gasta mais nos fins de semana? O delivery aumenta quando está estressado? As compras por impulso acontecem mais no final do mês?
              </p>

              <p>
                Esses padrões são ouro. Eles revelam comportamentos automáticos que você pode ajustar conscientemente. Não se trata de se punir, mas de fazer escolhas mais alinhadas com o que você realmente quer.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Exemplo prático</h3>

              <p>
                Imagine que Maria ganha R$ 4.000 por mês. Ela começa a registrar seus gastos e depois de 30 dias descobre o seguinte: R$ 1.200 de aluguel, R$ 400 de contas fixas, R$ 800 de supermercado, R$ 600 de delivery e restaurantes, R$ 400 de transporte, R$ 300 de compras diversas e R$ 200 de assinaturas. Total: R$ 3.900.
              </p>

              <p>
                Sobram apenas R$ 100. Mas Maria jurava que deveria sobrar pelo menos R$ 500. A diferença estava nos gastos que ela não percebia: o café diário, as compras pequenas, o delivery extra que virou rotina.
              </p>

              <p>
                Com essa visibilidade, Maria pode decidir onde quer ajustar. Talvez reduzir o delivery e cozinhar mais em casa. Talvez cancelar uma assinatura que não usa. O ponto é: agora ela pode escolher, porque ela vê.
              </p>

              {/* Planilha, caderno ou aplicativo */}
              <h2 className="text-2xl font-bold mt-12 mb-4">Planilha, caderno ou aplicativo de controle financeiro?</h2>

              <p>
                Uma das primeiras decisões de quem quer começar a organização financeira pessoal é escolher a ferramenta. Cada opção tem seus méritos, mas também suas limitações.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Vantagens e limitações das planilhas</h3>

              <p>
                Planilhas são flexíveis. Você pode personalizar exatamente do jeito que precisa, criar gráficos, fórmulas e análises sofisticadas. Para quem tem facilidade com Excel ou Google Sheets, pode ser uma ferramenta poderosa.
              </p>

              <p>
                O problema é que planilhas exigem disciplina para abrir, preencher e manter atualizadas. Elas não vão até você lembrando que faltou registrar algo. Não funcionam bem no celular. E qualquer erro de fórmula pode comprometer toda a análise sem você perceber.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Vantagens e limitações do caderno</h3>

              <p>
                O método do caderno tem o charme da simplicidade. Não precisa de internet, não depende de tecnologia, oferece uma conexão tátil com o processo. Para algumas pessoas, escrever à mão ajuda a fixar melhor as informações.
              </p>

              <p>
                Mas o caderno não calcula totais automaticamente, não gera gráficos, não mostra tendências ao longo do tempo. É fácil de esquecer em casa quando você mais precisa. E revisar meses anteriores para comparação é trabalhoso.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">Por que aplicativos de controle financeiro funcionam melhor no longo prazo</h3>

              <p>
                Aplicativos de controle financeiro foram projetados para o mundo real. Estão sempre no seu bolso, prontos para registrar um gasto em segundos. Calculam totais automaticamente, mostram gráficos claros, enviam lembretes quando você esquece de registrar.
              </p>

              <p>
                A grande vantagem está na redução de atrito. Quanto mais fácil for o processo, maior a chance de você manter o hábito. Um aplicativo bem desenhado transforma o registro de gastos em algo que leva menos de dez segundos.
              </p>

              <p>
                Além disso, bons aplicativos oferecem insights que seriam impossíveis de obter manualmente: comparações entre períodos, categorização automática, alertas de gastos excessivos. Eles fazem o trabalho pesado para que você possa focar nas decisões.
              </p>

              {/* Gamificação */}
              <h2 className="text-2xl font-bold mt-12 mb-4">Controle financeiro usando gamificação</h2>

              <p>
                Uma das maiores descobertas dos últimos anos sobre mudança de comportamento é o poder da gamificação. Quando transformamos uma tarefa em algo que se parece com um jogo, nossa motivação muda completamente.
              </p>

              <p>
                Pense em como você se sente ao completar níveis em um jogo, ganhar pontos ou desbloquear conquistas. Existe uma satisfação imediata que nos faz querer continuar. Agora imagine trazer essa mesma sensação para o controle financeiro.
              </p>

              <p>
                Metas visuais de progresso funcionam porque nosso cérebro adora ver barras enchendo e números subindo. Recompensas por constância funcionam porque criam ciclos positivos de comportamento. Desafios funcionam porque adicionam um elemento de jogo que torna o processo mais envolvente.
              </p>

              <p>
                Essa abordagem é especialmente eficaz para quem já tentou métodos tradicionais e não conseguiu manter. Quando organizar as finanças deixa de ser uma obrigação chata e se torna uma experiência com elementos de progressão e conquista, a constância aumenta naturalmente.
              </p>

              <p>
                É exatamente essa filosofia que guia as novas gerações de aplicativos financeiros: transformar o controle de gastos em uma jornada de evolução pessoal, não em uma punição.
              </p>

              {/* Erros comuns */}
              <h2 className="text-2xl font-bold mt-12 mb-4">Erros comuns que sabotam o controle financeiro</h2>

              <p>
                Mesmo com as melhores intenções, alguns erros podem minar completamente seus esforços de organização financeira. Conhecê-los é a melhor forma de evitá-los.
              </p>

              <p>
                <strong>Confundir receita com saldo.</strong> O dinheiro que entra não é o dinheiro que você tem disponível. Antes de pensar em qualquer gasto, as obrigações fixas já consumiram parte significativa da receita. Gastar pensando no total que entrou, sem considerar o que já está comprometido, é receita para o endividamento.
              </p>

              <p>
                <strong>Ignorar pequenos gastos.</strong> Um café de R$ 8. Um lanche de R$ 15. Uma assinatura de R$ 19,90 que você esqueceu que existe. Individualmente parecem irrelevantes. Somados ao longo do mês, podem representar centenas de reais. São os vazamentos silenciosos que drenam o orçamento.
              </p>

              <p>
                <strong>Uso incorreto do cartão de crédito.</strong> O cartão de crédito é uma ferramenta poderosa quando bem usada. O problema é quando ele cria a ilusão de dinheiro infinito. Parcelar tudo, pagar apenas o mínimo da fatura, usar o rotativo. Esses comportamentos transformam uma ferramenta útil em uma armadilha cara.
              </p>

              <p>
                <strong>Não revisar o orçamento.</strong> Criar um orçamento uma vez e nunca mais olhar para ele é como traçar uma rota no GPS e depois ignorar todas as instruções. A vida muda, as despesas mudam, as prioridades mudam. O orçamento precisa acompanhar essas mudanças.
              </p>

              {/* Como manter no longo prazo */}
              <h2 className="text-2xl font-bold mt-12 mb-4">Como manter o controle financeiro no longo prazo</h2>

              <p>
                O verdadeiro desafio não é começar. É continuar. Aqui estão os princípios que separam quem consegue manter o controle de quem desiste.
              </p>

              <p>
                <strong>Simplicidade acima de tudo.</strong> Sistemas complexos não sobrevivem ao dia a dia. Quanto mais simples for seu processo de registro e análise, maior a chance de você manter. Prefira algo que você consegue fazer em dois minutos a algo perfeito que exige uma hora.
              </p>

              <p>
                <strong>Revisão semanal curta.</strong> Reserve dez minutos por semana para olhar seus números. Não precisa ser uma análise profunda. Apenas conferir se está no caminho, identificar algum gasto inesperado, ajustar o que for necessário. Esse pequeno ritual faz toda a diferença.
              </p>

              <p>
                <strong>Ajustes contínuos sem culpa.</strong> Você vai estourar o orçamento algumas vezes. Vai ter meses melhores e piores. Isso é normal. O controle financeiro não é sobre perfeição, é sobre tendência. Se você está melhorando ao longo do tempo, está no caminho certo. Não use um mês ruim como desculpa para desistir.
              </p>

              {/* Qualidade de vida */}
              <h2 className="text-2xl font-bold mt-12 mb-4">Controle financeiro e qualidade de vida</h2>

              <p>
                Por que fazer tudo isso? Porque o controle financeiro não é um fim em si mesmo. É um meio para algo muito maior.
              </p>

              <p>
                <strong>Redução de estresse.</strong> Uma das principais fontes de ansiedade moderna é a incerteza financeira. Não saber se vai conseguir pagar as contas, se vai ter dinheiro para emergências, se está caminhando para uma armadilha. Quando você tem controle, essa ansiedade diminui drasticamente.
              </p>

              <p>
                <strong>Mais liberdade de escolha.</strong> Dinheiro organizado significa opções. Você pode dizer sim para oportunidades que aparecem. Pode mudar de emprego sem desespero. Pode lidar com imprevistos sem entrar em pânico. Pode fazer escolhas baseadas no que você quer, não no que você precisa para sobreviver.
              </p>

              <p>
                <strong>Dinheiro como ferramenta.</strong> No final, dinheiro é apenas uma ferramenta. Não é bom nem ruim em si mesmo. O que importa é como você usa. Com controle, você transforma essa ferramenta em algo que trabalha a seu favor, que constrói a vida que você quer viver.
              </p>

              {/* CTA Final */}
              <h2 className="text-2xl font-bold mt-12 mb-4">Comece agora seu controle financeiro</h2>

              <p>
                Você leu até aqui porque quer mudar. Porque está cansado de ver o dinheiro sumir sem explicação. Porque sabe que pode fazer melhor.
              </p>

              <p>
                O caminho está claro. Os obstáculos estão mapeados. As soluções estão ao seu alcance.
              </p>

              <p>
                O único passo que falta é começar. E o melhor momento para começar é agora, enquanto a motivação está fresca.
              </p>

              <p>
                Se você busca uma forma moderna, prática e até divertida de organizar suas finanças, vale conhecer o MoneyQuest. É um aplicativo de controle financeiro que usa gamificação para transformar o registro de gastos em uma experiência de evolução pessoal. Você ganha pontos por manter o hábito, completa desafios financeiros e acompanha seu progresso de forma visual e motivadora.
              </p>

              <p>
                Não é para todo mundo. Mas para quem já tentou outros métodos e não conseguiu manter, pode ser exatamente o que faltava.
              </p>

            </div>
          </div>
        </article>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Transforme Seu Controle Financeiro em Uma Jornada
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Registre gastos, ganhe XP, complete missões e evolua suas finanças de forma gamificada. Comece gratuitamente.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Related Content */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">
              Continue Aprendendo
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Link to="/educacao-financeira-gamificada" className="block">
                  <h3 className="text-lg font-semibold mb-2 text-primary hover:underline">
                    Educação Financeira Gamificada
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Descubra como aprender finanças pode ser envolvente e motivador com elementos de jogos.
                  </p>
                </Link>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Link to="/desafios-financeiros" className="block">
                  <h3 className="text-lg font-semibold mb-2 text-primary hover:underline">
                    Desafios Financeiros
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Conheça desafios práticos que ajudam a criar hábitos financeiros saudáveis.
                  </p>
                </Link>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Link to="/app-financas-pessoais" className="block">
                  <h3 className="text-lg font-semibold mb-2 text-primary hover:underline">
                    App de Finanças Pessoais
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Saiba como escolher o melhor aplicativo para gerenciar suas finanças.
                  </p>
                </Link>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ControleFinanceiro;
