
"use strict";

/*
  BarberHub - Autenticação demonstrativa

  O projeto utiliza localStorage e sessionStorage.
  As senhas não são armazenadas em texto puro.

  IMPORTANTE:
  A autenticação é local e demonstrativa.
  Não protege contas reais nem dados privados.
*/

(() => {
  const CHAVE_CLIENTES = "barberhub_clientes";
  const CHAVE_SESSAO = "barberhub_sessao_demo";

  const formCliente = document.getElementById("form-cliente");
  const formLogin = document.getElementById("form-login");
  const aviso = document.getElementById("auth-mensagem");

  const campo = id => document.getElementById(id);

  function informar(texto, tipo = "erro") {
    if (!aviso) return;

    aviso.hidden = false;
    aviso.dataset.tipo = tipo;
    aviso.textContent = texto;
  }

  function limparMensagem() {
    if (!aviso) return;

    aviso.hidden = true;
    aviso.textContent = "";
  }

  function obterClientes() {
    const salvo = localStorage.getItem(CHAVE_CLIENTES);

    if (!salvo) return [];

    const lista = JSON.parse(salvo);

    if (!Array.isArray(lista)) {
      throw new Error("Dados de clientes inválidos.");
    }

    return lista;
  }

  function normalizarEmail(email) {
    return String(email).trim().toLowerCase();
  }

  function bytesParaHex(bytes) {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function hexParaBytes(hex) {
    if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
      throw new Error("Verificador de senha inválido.");
    }

    return new Uint8Array(
      hex.match(/.{2}/g).map(valor => parseInt(valor, 16))
    );
  }

  // Gera um verificador com PBKDF2.
  // Isto não substitui autenticação em servidor.

  async function derivarSenha(senha, salt, iteracoes = 210000) {
    if (!crypto?.subtle) {
      throw new Error(
        "Abra o projeto pelo Live Server em localhost para usar senhas."
      );
    }

    const codificador = new TextEncoder();

    const chave = await crypto.subtle.importKey(
      "raw",
      codificador.encode(senha),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const resultado = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: iteracoes,
        hash: "SHA-256"
      },
      chave,
      256
    );

    return bytesParaHex(new Uint8Array(resultado));
  }

  async function criarVerificador(senha) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iteracoes = 210000;

    return {
      algoritmo: "PBKDF2-SHA256",
      salt: bytesParaHex(salt),
      iteracoes,
      hash: await derivarSenha(senha, salt, iteracoes)
    };
  }

  async function conferirSenha(senha, verificador) {
    if (
      !verificador ||
      verificador.algoritmo !== "PBKDF2-SHA256"
    ) {
      return false;
    }

    const salt = hexParaBytes(verificador.salt);

    const hashInformado = await derivarSenha(
      senha,
      salt,
      verificador.iteracoes
    );

    const esperado = hexParaBytes(verificador.hash);
    const recebido = hexParaBytes(hashInformado);

    if (esperado.length !== recebido.length) {
      return false;
    }

    let diferenca = 0;

    for (let i = 0; i < esperado.length; i++) {
      diferenca |= esperado[i] ^ recebido[i];
    }

    return diferenca === 0;
  }

  // ======================================
  // CADASTRO DE CLIENTES
  // ======================================

  if (formCliente) {
    const etapas = [
      ...formCliente.querySelectorAll(".auth-etapa")
    ];

    const voltar = campo("voltar-cliente");
    const proximo = campo("proximo-cliente");
    const salvar = campo("salvar-cliente");

    let atual = 0;

    const nomes = [
      "Dados pessoais",
      "Endereço",
      "Segurança"
    ];

    function mostrarEtapa(indice) {
      atual = indice;

      etapas.forEach((etapa, i) => {
        etapa.hidden = i !== indice;
      });

      campo("nome-etapa").textContent = nomes[indice];

      campo("contador-etapa").textContent =
        `Etapa ${indice + 1} de 3`;

      campo("barra-etapa").style.width =
        `${((indice + 1) / 3) * 100}%`;

      voltar.hidden = indice === 0;
      proximo.hidden = indice === 2;
      salvar.hidden = indice !== 2;

      limparMensagem();
    }

    function validarEtapa(indice) {
      const inputs = etapas[indice].querySelectorAll(
        'input:not([type="checkbox"])'
      );

      for (const input of inputs) {
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
          informar("Informe uma UF válida.");
          campo("usr-uf").focus();
          return false;
        }
      }

      if (indice === 2) {
        const senha = campo("usr-senha").value;
        const confirmacao = campo("usr-confirmar-senha").value;

        if (
          senha.length < 8 ||
          !/[a-zA-Z]/.test(senha) ||
          !/[0-9]/.test(senha)
        ) {
          informar(
            "A senha deve ter pelo menos 8 caracteres, " +
            "incluindo letras e números."
          );

          campo("usr-senha").focus();
          return false;
        }

        if (senha !== confirmacao) {
          informar("As senhas não coincidem.");
          campo("usr-confirmar-senha").focus();
          return false;
        }
      }

      limparMensagem();
      return true;
    }

    voltar.addEventListener("click", () => {
      mostrarEtapa(Math.max(0, atual - 1));
    });

    proximo.addEventListener("click", () => {
      if (validarEtapa(atual)) {
        mostrarEtapa(Math.min(2, atual + 1));
      }
    });

    // Mostrar ou ocultar senhas

    campo("mostrar-senhas").addEventListener("change", evento => {
      const tipo = evento.target.checked ? "text" : "password";

      campo("usr-senha").type = tipo;
      campo("usr-confirmar-senha").type = tipo;
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

    // ViaCEP

    campo("buscar-cep").addEventListener("click", async () => {
      const cep = campo("usr-cep").value.replace(/\D/g, "");

      if (cep.length !== 8) {
        informar("Informe um CEP com 8 números.");
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
          throw new Error("Erro ao consultar o CEP.");
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

        informar("Endereço encontrado!", "sucesso");
        campo("usr-numero").focus();

      } catch (erro) {
        informar(erro.message);

      } finally {
        botao.disabled = false;
        botao.textContent = "Buscar CEP";
      }
    });

    // Finalizar cadastro

    formCliente.addEventListener("submit", async evento => {
      evento.preventDefault();

      for (let i = 0; i < 3; i++) {
        mostrarEtapa(i);

        if (!validarEtapa(i)) {
          return;
        }
      }

      salvar.disabled = true;
      salvar.textContent = "Cadastrando...";

      try {
        const dados = new FormData(formCliente);
        const email = normalizarEmail(dados.get("email"));

        const clientes = obterClientes();

        const existe = clientes.some(
          cliente => normalizarEmail(cliente.email) === email
        );

        if (existe) {
          mostrarEtapa(0);
          informar("Já existe uma conta com esse e-mail.");
          campo("usr-email").focus();
          return;
        }

        const senha = campo("usr-senha").value;
        const verificador = await criarVerificador(senha);

        const cliente = {
          id: crypto.randomUUID(),
          nome: String(dados.get("nome")).trim(),
          telefone: String(dados.get("telefone")).trim(),
          email,

          verificadorSenha: verificador,

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

        // Reconsulta os dados antes de salvar

        const listaAtual = obterClientes();

        if (listaAtual.some(
          item => normalizarEmail(item.email) === email
        )) {
          mostrarEtapa(0);
          informar("Já existe uma conta com esse e-mail.");
          return;
        }

        localStorage.setItem(
          CHAVE_CLIENTES,
          JSON.stringify([...listaAtual, cliente])
        );

        informar(
          "Cadastro realizado! Redirecionando para o login...",
          "sucesso"
        );

        campo("usr-senha").value = "";
        campo("usr-confirmar-senha").value = "";

        setTimeout(() => {
          location.href = "login.html";
        }, 1200);

      } catch (erro) {
        console.error(erro);
        informar("Não foi possível concluir o cadastro.");

      } finally {
        salvar.disabled = false;
        salvar.textContent = "Finalizar cadastro";
      }
    });

    mostrarEtapa(0);
  }

  // ======================================
  // LOGIN COM CONFERÊNCIA DE SENHA
  // ======================================

  if (formLogin) {
    formLogin.addEventListener("submit", async evento => {
      evento.preventDefault();

      if (!formLogin.reportValidity()) {
        return;
      }

      const email = normalizarEmail(
        campo("login-email").value
      );

      const senha = campo("login-senha").value;

      const botao = formLogin.querySelector(
        'button[type="submit"]'
      );

      botao.disabled = true;
      botao.textContent = "Verificando...";

      try {
        const clientes = obterClientes();

        const cliente = clientes.find(
          item => normalizarEmail(item.email) === email
        );

        if (!cliente) {
          informar("E-mail ou senha incorretos.");
          return;
        }

        if (!cliente.verificadorSenha) {
          informar(
            "Este cadastro é anterior à criação de senhas. " +
            "Para testar o novo login, cadastre outro e-mail."
          );
          return;
        }

        const senhaCorreta = await conferirSenha(
          senha,
          cliente.verificadorSenha
        );

        if (!senhaCorreta) {
          informar("E-mail ou senha incorretos.");
          return;
        }

        // Guarda apenas informações de apresentação.
        // Esta sessão não concede autorização real.

        sessionStorage.setItem(
          CHAVE_SESSAO,
          JSON.stringify({
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            demonstracao: true
          })
        );

        campo("login-senha").value = "";

        informar(
          `Bem-vindo, ${cliente.nome}!`,
          "sucesso"
        );

        setTimeout(() => {
          location.href = "../index.html";
        }, 900);

      } catch (erro) {
        console.error(erro);
        informar("Não foi possível verificar o login.");

      } finally {
        botao.disabled = false;
        botao.textContent = "Entrar";
      }
    });
  }
})();
