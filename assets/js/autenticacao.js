
"use strict";

/*
  BarberHub - Cadastro de clientes e login demonstrativo

  ATENÇÃO:
  Não implementa autenticação real.
  Não armazena nem valida senhas.
  Não deve proteger páginas ou dados privados.
*/

(() => {
  const CHAVE_CLIENTES = "barberhub_clientes";
  const CHAVE_SESSAO = "barberhub_sessao_demo";

  const formularioCliente =
    document.getElementById("form-cliente");

  const formularioLogin =
    document.getElementById("form-login");

  const aviso = document.getElementById("auth-mensagem");

  const campo = id => document.getElementById(id);

  function informar(texto, tipo = "erro") {
    aviso.hidden = false;
    aviso.dataset.tipo = tipo;
    aviso.textContent = texto;
  }

  function limparMensagem() {
    aviso.hidden = true;
    aviso.textContent = "";
  }

  function obterClientes() {
    const salvo = localStorage.getItem(CHAVE_CLIENTES);

    if (salvo === null) {
      return [];
    }

    const clientes = JSON.parse(salvo);

    if (!Array.isArray(clientes)) {
      throw new Error("Dados de clientes inválidos.");
    }

    return clientes;
  }

  function normalizarEmail(email) {
    return String(email).trim().toLowerCase();
  }

  // ========================================
  // CADASTRO DE CLIENTES
  // ========================================

  if (formularioCliente) {
    const etapas = [
      ...formularioCliente.querySelectorAll(".auth-etapa")
    ];

    const voltar = campo("voltar-cliente");
    const proximo = campo("proximo-cliente");
    const salvar = campo("salvar-cliente");

    let etapaAtual = 0;

    function mostrarEtapa(indice) {
      etapaAtual = indice;

      etapas.forEach((etapa, i) => {
        etapa.hidden = i !== indice;
      });

      campo("nome-etapa").textContent =
        indice === 0 ? "Dados pessoais" : "Endereço";

      campo("contador-etapa").textContent =
        `Etapa ${indice + 1} de 2`;

      campo("barra-etapa").style.width =
        `${(indice + 1) * 50}%`;

      voltar.hidden = indice === 0;
      proximo.hidden = indice === 1;
      salvar.hidden = indice !== 1;

      limparMensagem();
    }

    function validarEtapa(indice) {
      const campos = etapas[indice]
        .querySelectorAll("input");

      for (const input of campos) {
        if (!input.checkValidity()) {
          informar("Confira os campos obrigatórios.");

          input.focus();
          input.reportValidity();

          return false;
        }
      }

      if (indice === 0) {
        const telefone = campo("usr-telefone")
          .value.replace(/\D/g, "");

        if (telefone.length < 10 || telefone.length > 11) {
          informar("Informe um telefone válido com DDD.");
          campo("usr-telefone").focus();
          return false;
        }
      }

      if (indice === 1) {
        const uf = campo("usr-uf").value.trim();

        if (!/^[a-zA-Z]{2}$/.test(uf)) {
          informar("Informe uma UF válida com duas letras.");
          campo("usr-uf").focus();
          return false;
        }
      }

      limparMensagem();
      return true;
    }

    voltar.addEventListener("click", () => {
      mostrarEtapa(0);
    });

    proximo.addEventListener("click", () => {
      if (validarEtapa(0)) {
        mostrarEtapa(1);
      }
    });

    // Máscara do CEP
    campo("usr-cep").addEventListener("input", evento => {
      const numeros = evento.target.value
        .replace(/\D/g, "")
        .slice(0, 8);

      evento.target.value = numeros.length > 5
        ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
        : numeros;
    });

    // Consulta ViaCEP
    campo("buscar-cep").addEventListener("click", async () => {
      const cep = campo("usr-cep").value.replace(/\D/g, "");

      if (cep.length !== 8) {
        informar("Digite um CEP com 8 números.");
        return;
      }

      const botao = campo("buscar-cep");

      botao.disabled = true;
      botao.textContent = "Buscando...";

      try {
        const resposta = await fetch(
          `https://viacep.com.br/ws/${cep}/json/`
        );

        if (!resposta.ok) {
          throw new Error("Não foi possível consultar o CEP.");
        }

        const dados = await resposta.json();

        if (dados.erro) {
          throw new Error("CEP não encontrado.");
        }

        campo("usr-logradouro").value =
          dados.logradouro || "";

        campo("usr-bairro").value =
          dados.bairro || "";

        campo("usr-cidade").value =
          dados.localidade || "";

        campo("usr-uf").value =
          dados.uf || "";

        informar(
          "Endereço encontrado! Confira os dados.",
          "sucesso"
        );

        campo("usr-numero").focus();

      } catch (erro) {
        informar(erro.message);
      } finally {
        botao.disabled = false;
        botao.textContent = "Buscar CEP";
      }
    });

    formularioCliente.addEventListener("submit", evento => {
      evento.preventDefault();

      if (!validarEtapa(0)) {
        mostrarEtapa(0);
        informar("Confira os dados pessoais.");
        return;
      }

      if (!validarEtapa(1)) {
        mostrarEtapa(1);
        informar("Confira o endereço.");
        return;
      }

      const dados = new FormData(formularioCliente);

      const cliente = {
        id: crypto.randomUUID(),
        nome: String(dados.get("nome")).trim(),
        telefone: String(dados.get("telefone")).trim(),
        email: normalizarEmail(dados.get("email")),
        endereco: {
          cep: String(dados.get("cep")).replace(/\D/g, ""),
          logradouro: String(dados.get("logradouro")).trim(),
          numero: String(dados.get("numero")).trim(),
          bairro: String(dados.get("bairro")).trim(),
          cidade: String(dados.get("cidade")).trim(),
          uf: String(dados.get("uf")).trim().toUpperCase()
        },
        criadoEm: new Date().toISOString()
      };

      try {
        const clientes = obterClientes();

        const emailExiste = clientes.some(
          item => normalizarEmail(item.email) === cliente.email
        );

        if (emailExiste) {
          mostrarEtapa(0);
          informar("Já existe um cliente com esse e-mail.");
          campo("usr-email").focus();
          return;
        }

        localStorage.setItem(
          CHAVE_CLIENTES,
          JSON.stringify([...clientes, cliente])
        );

        informar(
          "Cadastro demonstrativo realizado com sucesso!",
          "sucesso"
        );

        salvar.disabled = true;

        setTimeout(() => {
          location.href = "login.html";
        }, 900);

      } catch (erro) {
        console.error(erro);
        informar("Não foi possível salvar o cadastro.");
      }
    });

    mostrarEtapa(0);
  }

  // ========================================
  // LOGIN DEMONSTRATIVO
  // ========================================

  if (formularioLogin) {
    formularioLogin.addEventListener("submit", evento => {
      evento.preventDefault();

      if (!formularioLogin.reportValidity()) {
        return;
      }

      const email = normalizarEmail(
        campo("login-email").value
      );

      // A senha não é lida, armazenada nem validada.
      // Este fluxo apenas demonstra a interface de entrada.
      try {
        const clientes = obterClientes();

        const cliente = clientes.find(
          item => normalizarEmail(item.email) === email
        );

        if (!cliente) {
          informar(
            "E-mail não encontrado neste navegador. " +
            "Crie um cadastro demonstrativo primeiro."
          );
          return;
        }

        sessionStorage.setItem(
          CHAVE_SESSAO,
          JSON.stringify({
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            demonstracao: true
          })
        );

        informar(
          `Bem-vindo, ${cliente.nome}! Entrada demonstrativa realizada.`,
          "sucesso"
        );

        setTimeout(() => {
          location.href = "../index.html";
        }, 1100);

      } catch (erro) {
        console.error(erro);
        informar("Não foi possível carregar os clientes.");
      }
    });
  }
})();
