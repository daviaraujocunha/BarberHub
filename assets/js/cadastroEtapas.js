
/* Cadastro em etapas - BarberHub */

(() => {
  "use strict";

  const form = document.getElementById("cadastro-etapas");
  if (!form) return;

  const etapas = [...form.querySelectorAll(".etapa")];

  const etapasMenu = [
    ...document.querySelectorAll("#lista-etapas li")
  ];

  const nomes = [
    "Dados da barbearia",
    "Endereço",
    "Equipe",
    "Funcionamento",
    "Serviços e valores"
  ];

  const aviso = document.getElementById("mensagem-form");
  const botaoVoltar = document.getElementById("voltar-etapa");
  const botaoProximo = document.getElementById("proxima-etapa");
  const botaoSalvar = document.getElementById("salvar-barbearia");
  const campoFoto = document.getElementById("barber-foto");
  const previewFoto = document.getElementById("preview-foto");

  const idEdicao = new URLSearchParams(location.search).get("id");

  // Reutiliza as funções de armazenamento do script.js
  const registros = obterBarbearias();

  const existente = idEdicao
    ? registros.find(item => String(item.id) === idEdicao)
    : null;

  let atual = 0;

  const servicos = [
    ["srv-corte", "preco-corte", "Corte Masculino"],
    ["srv-barba", "preco-barba", "Barba / Barboterapia"],
    ["srv-combo", "preco-combo", "Combo (Corte + Barba)"],
    ["srv-sobrancelha", "preco-sobrancelha", "Sobrancelha"]
  ];

  const campo = id => document.getElementById(id);

  // ==========================================
  // MENSAGENS DE FEEDBACK
  // ==========================================

  function informar(texto, tipo = "erro") {
    aviso.hidden = false;
    aviso.dataset.tipo = tipo;
    aviso.textContent = texto;
  }

  function limparAviso() {
    aviso.hidden = true;
    aviso.textContent = "";
  }

  // ==========================================
  // NAVEGAÇÃO ENTRE ETAPAS
  // ==========================================

  function mostrarEtapa(indice, rolar = true) {
    atual = indice;

    etapas.forEach((etapa, i) => {
      etapa.hidden = i !== indice;
    });

    etapasMenu.forEach((item, i) => {
      item.classList.toggle("ativo", i === indice);
      item.classList.toggle("concluido", i < indice);

      if (i === indice) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
    });

    campo("nome-passo").textContent = nomes[indice];

    campo("contador-passo").textContent =
      `Etapa ${indice + 1} de ${etapas.length}`;

    campo("barra-progresso").style.width =
      `${(indice + 1) * 100 / etapas.length}%`;

    botaoVoltar.hidden = indice === 0;

    botaoProximo.hidden =
      indice === etapas.length - 1;

    botaoSalvar.hidden =
      indice !== etapas.length - 1;

    limparAviso();

    if (rolar) {
      document.querySelector(".cartao-cadastro")
        .scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  function invalidar(texto, elemento) {
    informar(texto);

    if (elemento) {
      elemento.focus();

      if (!elemento.checkValidity()) {
        elemento.reportValidity();
      }
    }

    return false;
  }

  function validarEtapa(indice) {
    const inputs = etapas[indice]
      .querySelectorAll("input, select");

    for (const input of inputs) {
      if (input.disabled || input.type === "checkbox") {
        continue;
      }

      if (!input.checkValidity()) {
        return invalidar(
          "Confira os campos obrigatórios desta etapa.",
          input
        );
      }
    }

    // Verifica os profissionais opcionais
    if (indice === 2) {
      for (let i = 2; i <= 3; i++) {
        const nome = campo(`barbeiro${i}-nome`);
        const sobrenome = campo(`barbeiro${i}-sobrenome`);

        if (nome.value.trim() && !sobrenome.value.trim()) {
          return invalidar(
            "Informe o sobrenome do profissional preenchido.",
            sobrenome
          );
        }

        if (!nome.value.trim() && sobrenome.value.trim()) {
          return invalidar(
            "Informe o nome do profissional preenchido.",
            nome
          );
        }
      }
    }

    // Verifica horários e dias
    if (indice === 3) {
      if (
        campo("hora-fechamento").value <=
        campo("hora-abertura").value
      ) {
        return invalidar(
          "O fechamento deve ser depois da abertura.",
          campo("hora-fechamento")
        );
      }

      if (!form.querySelector('input[name="dias"]:checked')) {
        return invalidar(
          "Selecione ao menos um dia de atendimento."
        );
      }
    }

    // Verifica serviços e preços
    if (indice === 4) {
      const temServico = servicos.some(
        ([check]) => campo(check).checked
      );

      if (!temServico) {
        return invalidar("Selecione ao menos um serviço.");
      }

      for (const [check, preco] of servicos) {
        if (
          campo(check).checked &&
          (
            campo(preco).value === "" ||
            Number(campo(preco).value) < 0
          )
        ) {
          return invalidar(
            "Informe um preço válido para os serviços selecionados.",
            campo(preco)
          );
        }
      }
    }

    limparAviso();
    return true;
  }

  // ==========================================
  // HABILITAR PREÇOS DOS SERVIÇOS
  // ==========================================

  function atualizarServicos() {
    servicos.forEach(([check, preco]) => {
      const ativado = campo(check).checked;

      campo(preco).disabled = !ativado;
      campo(preco).required = ativado;
    });
  }

  // ==========================================
  // PRÉVIA DA FOTO
  // ==========================================

  function fotoParaPagina(foto) {
    if (/^assets\/img\/[a-z0-9._-]+$/i.test(foto || "")) {
      return `../${foto}`;
    }

    if (/^data:image\/(jpeg|png|webp);base64,/i.test(foto || "")) {
      return foto;
    }

    return "";
  }

  function mostrarFoto(foto) {
    const src = fotoParaPagina(foto);

    if (!src) {
      previewFoto.hidden = true;
      previewFoto.removeAttribute("src");
      return;
    }

    previewFoto.src = src;
    previewFoto.hidden = false;
  }

  campoFoto.addEventListener("change", () => {
    const arquivo = campoFoto.files[0];

    if (!arquivo) {
      mostrarFoto(existente?.foto || "");
      return;
    }

    if (
      !arquivo.type.startsWith("image/") ||
      arquivo.size > 5 * 1024 * 1024
    ) {
      campoFoto.value = "";

      informar(
        "Selecione uma imagem JPG, PNG ou WebP de até 5 MB."
      );

      return;
    }

    const url = URL.createObjectURL(arquivo);

    previewFoto.onload = () => {
      URL.revokeObjectURL(url);
    };

    previewFoto.src = url;
    previewFoto.hidden = false;

    limparAviso();
  });

  // ==========================================
  // PREENCHIMENTO PARA EDIÇÃO
  // ==========================================

  function carregarEdicao(item) {
    campo("titulo-pagina").textContent = "Editar barbearia";

    botaoSalvar.textContent = "Salvar alterações";

    campoFoto.required = false;

    campo("barber-cep").required = Boolean(item.cep);

    mostrarFoto(item.foto);

    const valores = {
      "barber-nome": item.nome,

      "barber-categoria":
        item.categoria === "premium"
          ? "premium"
          : "tradicional",

      "barber-resp": item.responsavel,
      "barber-email": item.email,

      "barber-cep": item.cep
        ? String(item.cep).replace(
            /^(\d{5})(\d{3})$/,
            "$1-$2"
          )
        : "",

      "barber-logradouro": item.logradouro,
      "barber-numero": item.numero,
      "barber-bairro": item.bairro,
      "barber-cidade": item.cidade,
      "barber-uf": item.uf,

      "hora-abertura": item.horarios?.abertura,
      "hora-fechamento": item.horarios?.fechamento
    };

    Object.entries(valores).forEach(([id, valor]) => {
      campo(id).value = valor ?? "";
    });

    const equipeExistente = equipe(item);

    equipeExistente.slice(0, 3).forEach((pessoa, i) => {
      const partes = pessoa.nome.trim().split(/\s+/);

      campo(`barbeiro${i + 1}-nome`).value =
        partes.shift() || "";

      campo(`barbeiro${i + 1}-sobrenome`).value =
        partes.join(" ");
    });

    const dias = diasNormalizados(item);

    form.querySelectorAll('input[name="dias"]')
      .forEach(input => {
        input.checked = dias.includes(input.value);
      });

    servicos.forEach(([check, preco, nome]) => {
      const anterior = (item.servicos || [])
        .find(s => s.nome === nome);

      campo(check).checked = Boolean(anterior);

      if (anterior) {
        campo(preco).value = anterior.preco;
      }
    });

    atualizarServicos();
  }

  // ==========================================
  // CONSULTA VIA CEP
  // ==========================================

  const inputCep = campo("barber-cep");

  inputCep.addEventListener("input", () => {
    const numeros = inputCep.value
      .replace(/\D/g, "")
      .slice(0, 8);

    inputCep.value = numeros.length > 5
      ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
      : numeros;
  });

  campo("buscar-cep").addEventListener("click", async () => {
    const cep = inputCep.value.replace(/\D/g, "");

    if (cep.length !== 8) {
      return invalidar(
        "Digite um CEP com 8 números.",
        inputCep
      );
    }

    const botao = campo("buscar-cep");

    botao.disabled = true;
    botao.textContent = "Buscando...";

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      );

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível consultar o CEP."
        );
      }

      const dados = await resposta.json();

      if (dados.erro) {
        throw new Error("CEP não encontrado.");
      }

      campo("barber-logradouro").value =
        dados.logradouro || "";

      campo("barber-bairro").value =
        dados.bairro || "";

      campo("barber-cidade").value =
        dados.localidade || "";

      campo("barber-uf").value =
        dados.uf || "";

      informar(
        "Endereço localizado! Confira o número e os demais campos.",
        "sucesso"
      );

      campo("barber-numero").focus();

    } catch (erro) {
      informar(
        erro.message || "Erro ao consultar CEP."
      );

    } finally {
      botao.disabled = false;
      botao.textContent = "Buscar CEP";
    }
  });

  // ==========================================
  // EVENTOS DE NAVEGAÇÃO
  // ==========================================

  servicos.forEach(([check]) => {
    campo(check).addEventListener(
      "change",
      atualizarServicos
    );
  });

  atualizarServicos();

  botaoVoltar.addEventListener("click", () => {
    mostrarEtapa(Math.max(0, atual - 1));
  });

  botaoProximo.addEventListener("click", () => {
    if (validarEtapa(atual)) {
      mostrarEtapa(
        Math.min(etapas.length - 1, atual + 1)
      );
    }
  });

  // ==========================================
  // SALVAR CADASTRO OU EDIÇÃO
  // ==========================================

  form.addEventListener("submit", async evento => {
    evento.preventDefault();

    if (idEdicao && !existente) {
      return informar(
        "Barbearia não encontrada. Volte à página inicial."
      );
    }

    if (atual < etapas.length - 1) {
      if (validarEtapa(atual)) {
        mostrarEtapa(atual + 1);
      }
      return;
    }

    // Valida todas as etapas antes de salvar
    for (let i = 0; i < etapas.length; i++) {
      mostrarEtapa(i, false);

      if (!validarEtapa(i)) {
        return;
      }
    }

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    try {
      const dados = new FormData(form);

      const arquivoFoto = campoFoto.files[0];

      const foto = arquivoFoto
        ? await imagemReduzida(arquivoFoto)
        : existente?.foto || "";

      if (!foto) {
        throw new Error("Envie uma foto da fachada.");
      }

      // Coletar os profissionais
      const anteriores = existente
        ? equipe(existente)
        : [];

      const barbeiros = [];

      for (let i = 1; i <= 3; i++) {
        const nome = `
          ${campo(`barbeiro${i}-nome`).value.trim()}
          ${campo(`barbeiro${i}-sobrenome`).value.trim()}
        `.trim().replace(/\s+/g, " ");

        if (!nome) continue;

        const arquivo = campo(`barbeiro${i}-foto`).files[0];

        const fotoProfissional = arquivo
          ? await imagemReduzida(arquivo, 300)
          : anteriores[i - 1]?.foto || "";

        barbeiros.push({
          nome,
          foto: fotoProfissional
        });
      }

      // Montar registro mantendo dados anteriores
      const registro = {
        ...(existente || {}),

        id: existente?.id ||
          (window.crypto?.randomUUID?.() || String(Date.now())),

        nome: String(dados.get("nome_barbearia")).trim(),
        foto,

        categoria: String(dados.get("categoria")),
        responsavel: String(dados.get("responsavel")).trim(),
        email: String(dados.get("email")).trim(),

        cep: String(dados.get("cep") || "")
          .replace(/\D/g, ""),

        logradouro: String(dados.get("logradouro")).trim(),
        numero: String(dados.get("numero")).trim(),
        bairro: String(dados.get("bairro")).trim(),
        cidade: String(dados.get("cidade")).trim(),
        uf: String(dados.get("uf")).trim().toUpperCase(),

        horarios: {
          abertura: String(dados.get("hora_abertura")),
          fechamento: String(dados.get("hora_fechamento"))
        },

        dias: dados.getAll("dias"),

        barbeiros,

        servicos: servicos
          .filter(([check]) => campo(check).checked)
          .map(([, preco, nome]) => ({
            nome,
            preco: Number(campo(preco).value)
          })),

        avaliacao: existente?.avaliacao ?? 0,
        avaliacoes: existente?.avaliacoes ?? 0,

        criadaEm: existente?.criadaEm ||
          new Date().toISOString()
      };

      // Lê os dados novamente para evitar perder outros cadastros
      const salvo = localStorage.getItem(
        "barberhub_barbearias"
      );

      const lista = salvo === null
        ? obterBarbearias()
        : JSON.parse(salvo);

      if (!Array.isArray(lista)) {
        throw new Error(
          "Dados salvos inválidos. Nenhum cadastro foi sobrescrito."
        );
      }

      const atualizados = existente
        ? lista.map(item =>
            String(item.id) === String(existente.id)
              ? registro
              : item
          )
        : [...lista, registro];

      salvarBarbearias(atualizados);

      informar(
        existente
          ? "Alterações salvas com sucesso!"
          : "Barbearia cadastrada com sucesso!",
        "sucesso"
      );

      location.href = "../index.html";

    } catch (erro) {
      console.error(erro);

      informar(
        erro.message ||
        "Não foi possível salvar. Confira o armazenamento do navegador."
      );

      botaoSalvar.disabled = false;

      botaoSalvar.textContent = existente
        ? "Salvar alterações"
        : "Concluir cadastro";
    }
  });

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  mostrarEtapa(0, false);

  if (idEdicao && !existente) {
    informar(
      "Barbearia não encontrada. Volte à página inicial."
    );

    botaoProximo.disabled = true;
    botaoSalvar.disabled = true;

  } else if (existente) {
    carregarEdicao(existente);
  }

})();