document.addEventListener("DOMContentLoaded", () => {
  const urlApi = "https://apiprojetoproz-10.onrender.com/api/leads";
  const urlResumo = "https://apiprojetoproz-10.onrender.com/api/leads/resumo";
  const usuario = window.prompt("Digite o usuário do painel administrativo:");
  if (usuario !== "adm") {
    window.alert("Usuário ou senha incorretos.");
    return;
  }

  const senha = window.prompt("Digite a senha do painel administrativo:");
  if (senha !== "adm") {
    window.alert("Usuário ou senha incorretos.");
    return;
  }

  document.querySelector("#conteudo-admin").hidden = false;

  const campos = [
    ["nome", "Nome"],
    ["whatsapp", "WhatsApp"],
    ["cidade", "Cidade"],
    ["tipo", "Tipo"],
    ["valor", "Valor da carta"],
    ["parcela", "Parcela desejada"],
    ["lance", "Lance disponível"],
    ["prazoCompra", "Prazo de compra"],
    ["objetivo", "Objetivo"],
    ["renda", "Renda mensal"],
    ["profissao", "Profissão"],
    ["email", "E-mail"],
    ["horario", "Melhor horário"],
    ["forma", "Forma de contato"],
    ["obs", "Observações"],
    ["consentimentoContato", "Autorizou contato"],
    ["aceitouPoliticaPrivacidade", "Aceitou política de privacidade"]
  ];

  const camposFinanceiros = new Set(["valor", "parcela", "lance", "renda"]);
  const elementoStatus = document.querySelector("#status");
  const elementoContador = document.querySelector("#contador-leads");
  const corpoTabela = document.querySelector("#corpo-leads");
  const campoBusca = document.querySelector("#busca");
  const botaoAtualizar = document.querySelector("#botao-atualizar");
  const elementoResumo = document.querySelector("#resumo-leads");

  let leads = [];

  function obterListaLeads(resultado) {
    if (Array.isArray(resultado)) return resultado;
    if (resultado && typeof resultado === "object") {
      if (Array.isArray(resultado.leads)) return resultado.leads;
      if (Array.isArray(resultado.data)) return resultado.data;
      if (resultado.data && Array.isArray(resultado.data.leads)) return resultado.data.leads;
    }
    throw new Error("Formato inesperado na resposta da API. Era esperada uma lista de leads.");
  }

  function exibirValor(chave, valor) {
    if (valor === null || valor === undefined || valor === "") return "—";
    if (typeof valor === "boolean") return valor ? "Sim" : "Não";
    if (camposFinanceiros.has(chave) && typeof valor === "number") {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2
      }).format(valor);
    }
    return String(valor);
  }

  function criarCelula(valor, nomeClasse) {
    const celula = document.createElement("td");
    if (nomeClasse) celula.className = nomeClasse;
    celula.textContent = valor;
    return celula;
  }

  function criarDetalhes(lead) {
    const linha = document.createElement("tr");
    linha.className = "linha-detalhes";
    const celula = document.createElement("td");
    celula.colSpan = 7;

    const detalhes = document.createElement("details");
    const resumo = document.createElement("summary");
    resumo.textContent = "Ver todos os dados";
    const grade = document.createElement("div");
    grade.className = "grade-detalhes";

    campos.forEach(([chave, label]) => {
      const item = document.createElement("div");
      item.className = "item-detalhe";
      const rotulo = document.createElement("span");
      rotulo.className = "rotulo-detalhe";
      rotulo.textContent = label;
      const valor = document.createElement("span");
      valor.className = "valor-detalhe";
      valor.textContent = exibirValor(chave, lead[chave]);
      item.append(rotulo, valor);
      grade.append(item);
    });

    detalhes.append(resumo, grade);
    celula.append(detalhes);
    linha.append(celula);
    return linha;
  }

  function renderizarLeads() {
    const consulta = campoBusca.value.trim().toLocaleLowerCase("pt-BR");
    const leadsFiltrados = leads.filter((lead) =>
      campos.some(([chave]) =>
        exibirValor(chave, lead[chave]).toLocaleLowerCase("pt-BR").includes(consulta)
      )
    );

    corpoTabela.replaceChildren();
    elementoContador.textContent = consulta
      ? `${leadsFiltrados.length} de ${leads.length} lead(s)`
      : `${leads.length} lead(s)`;

    if (leadsFiltrados.length === 0) {
      const linha = document.createElement("tr");
      const celula = document.createElement("td");
      celula.className = "celula-vazia";
      celula.colSpan = 7;
      celula.textContent = leads.length
        ? "Nenhum lead encontrado para essa busca."
        : "Nenhum lead recebido ainda.";
      linha.append(celula);
      corpoTabela.append(linha);
      return;
    }

    leadsFiltrados.forEach((lead) => {
      const linha = document.createElement("tr");
      const celulaNome = document.createElement("td");
      const nome = document.createElement("span");
      nome.className = "nome-lead";
      nome.textContent = exibirValor("nome", lead.nome);
      celulaNome.append(nome);

      const telefone = exibirValor("whatsapp", lead.whatsapp);
      const valorTelefone = criarCelula(telefone);
      const cidade = criarCelula(exibirValor("cidade", lead.cidade));
      const celulaTipo = document.createElement("td");
      const etiquetaTipo = document.createElement("span");
      etiquetaTipo.className = "etiqueta-tipo";
      etiquetaTipo.textContent = exibirValor("tipo", lead.tipo);
      celulaTipo.append(etiquetaTipo);

      const dicaDetalhes = criarCelula("Ver abaixo");
      dicaDetalhes.className = "dica-detalhes";

      linha.append(
        celulaNome,
        valorTelefone,
        cidade,
        celulaTipo,
        criarCelula(exibirValor("valor", lead.valor)),
        criarCelula(exibirValor("prazoCompra", lead.prazoCompra)),
        dicaDetalhes
      );

      const linhaDetalhes = criarDetalhes(lead);
      corpoTabela.append(linha, linhaDetalhes);
    });
  }

  async function carregarLeads() {
    botaoAtualizar.disabled = true;
    botaoAtualizar.textContent = "Carregando...";
    elementoStatus.className = "status";
    elementoStatus.textContent = "Carregando leads...";

    try {
      const resposta = await fetch(urlApi, {
        headers: { Accept: "application/json" }
      });

      const tipoConteudo = resposta.headers.get("content-type") || "";
      const resultado = tipoConteudo.includes("application/json")
        ? await resposta.json()
        : await resposta.text();

      if (!resposta.ok) {
        const detalhe = typeof resultado === "string"
          ? resultado.slice(0, 200)
          : JSON.stringify(resultado);
        throw new Error(`Erro HTTP ${resposta.status}${detalhe ? `: ${detalhe}` : ""}`);
      }

      if (typeof resultado === "string") {
        throw new Error("A API não retornou JSON. Verifique a rota GET /api/leads.");
      }

      leads = obterListaLeads(resultado).filter(
        (lead) => lead && typeof lead === "object" && !Array.isArray(lead)
      );

      renderizarLeads();
      elementoStatus.className = "status success";
      elementoStatus.textContent = "Lista atualizada com sucesso.";
    } catch (erro) {
      console.error("Não foi possível carregar os leads:", erro);
      elementoStatus.className = "status error";
      elementoStatus.textContent = erro instanceof TypeError
        ? "Falha de conexão. Verifique se a API está disponível e permite acesso por CORS."
        : erro.message;
      elementoContador.textContent = "";
      corpoTabela.replaceChildren();
      const linha = document.createElement("tr");
      const celula = document.createElement("td");
      celula.className = "celula-vazia";
      celula.colSpan = 7;
      celula.textContent = "Os leads não puderam ser carregados.";
      linha.append(celula);
      corpoTabela.append(linha);
    } finally {
      botaoAtualizar.disabled = false;
      botaoAtualizar.textContent = "Atualizar lista";
    }
  }

  async function carregarResumo() {
    elementoResumo.textContent = "Carregando resumo...";

    try {
      const resposta = await fetch(urlResumo, {
        headers: { Accept: "application/json" }
      });

      if (!resposta.ok) {
        throw new Error(`Erro HTTP ${resposta.status}`);
      }

      const resultado = await resposta.json();
      if (!resultado || typeof resultado.resumo !== "string") {
        throw new Error("Formato inesperado na resposta do resumo.");
      }

      elementoResumo.textContent = resultado.resumo;
    } catch (erro) {
      console.error("Não foi possível carregar o resumo dos leads:", erro);
      elementoResumo.textContent = "Não foi possível carregar o resumo dos leads.";
    }
  }

  campoBusca.addEventListener("input", renderizarLeads);
  botaoAtualizar.addEventListener("click", () => {
    carregarLeads();
    carregarResumo();
  });
  carregarLeads();
  carregarResumo();
});
