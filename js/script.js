document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formulario-leads");

  if (!formulario) return;

  const botaoEnviar = formulario.querySelector("#botao-enviar");
  const statusEnvio = formulario.querySelector("#status-envio");

  const regrasNumericas = {
    renda: { min: 0, mensagem: "A renda mensal não pode ser negativa." },
    valor: { min: 1, mensagem: "O valor da carta deve ser maior que zero." },
    parcela: { min: 0, mensagem: "A parcela desejada não pode ser negativa." },
    lance: { min: 0, mensagem: "O lance disponível não pode ser negativo." }
  };

  function validarCamposNumericos() {
    let formularioValido = true;

    Object.entries(regrasNumericas).forEach(([nomeCampo, regra]) => {
      const campo = formulario.elements[nomeCampo];

      if (!campo) return;

      const valor = campo.value.trim();
      const numero = Number(valor);

      if (valor === "" || Number.isNaN(numero) || numero < regra.min) {
        campo.setCustomValidity(regra.mensagem);
        formularioValido = false;
        return;
      }

      campo.setCustomValidity("");
    });

    return formularioValido;
  }

  Object.keys(regrasNumericas).forEach((nomeCampo) => {
    const campo = formulario.elements[nomeCampo];

    if (!campo) return;

    campo.addEventListener("input", () => {
      if (campo.value === "") {
        campo.setCustomValidity("");
        return;
      }

      const numero = Number(campo.value);
      const regra = regrasNumericas[nomeCampo];

      campo.setCustomValidity(
        Number.isNaN(numero) || numero < regra.min ? regra.mensagem : ""
      );
    });
  });

  formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validarCamposNumericos() || !formulario.reportValidity()) return;

    const dados = Object.fromEntries(new FormData(formulario).entries());

    ["valor", "parcela", "lance", "renda"].forEach((chave) => {
      dados[chave] = Number(dados[chave]);
    });

    dados.consentimentoContato = formulario.elements.consentimentoContato.checked;
    dados.aceitouPoliticaPrivacidade = formulario.elements.aceitouPoliticaPrivacidade.checked;

    botaoEnviar.disabled = true;
    botaoEnviar.textContent = "Enviando...";
    statusEnvio.textContent = "";
    statusEnvio.classList.remove("sucesso", "erro");
    statusEnvio.style.color = "";

    try {
      const resposta = await fetch("https://apiprojetoproz-10.onrender.com/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(dados)
      });

      const tipoConteudo = resposta.headers.get("content-type") || "";
      const resultado = tipoConteudo.includes("application/json")
        ? await resposta.json()
        : await resposta.text();

      if (!resposta.ok) {
        throw new Error(
          "Erro HTTP " +
            resposta.status +
            ": " +
            (typeof resultado === "string" ? resultado.slice(0, 200) : JSON.stringify(resultado))
        );
      }

      if (typeof resultado === "string") {
        throw new Error("A API retornou HTML ou texto. Verifique a rota POST /api/leads.");
      }

      statusEnvio.classList.remove("erro");
      statusEnvio.classList.add("sucesso");
      statusEnvio.style.color = "#176534";
      statusEnvio.textContent = resultado.message || "Cadastro enviado com sucesso! Em breve entraremos em contato.";
      formulario.reset();
    } catch (erro) {
      console.error(erro);
      statusEnvio.classList.remove("sucesso");
      statusEnvio.classList.add("erro");
      statusEnvio.style.color = "#a32121";
      statusEnvio.textContent = erro instanceof TypeError
        ? "Falha de conexão. Verifique a API e a configuração de CORS."
        : erro.message;
    } finally {
      botaoEnviar.disabled = false;
      botaoEnviar.textContent = "Enviar minha simulação";
    }
  });
});
