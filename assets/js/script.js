
"use strict";

const CHAVE_STORAGE = "barberhub_barbearias";

const barbeariasIniciais = [
  {
    id: "barberpub",
    nome: "Barber Pub",
    foto: "assets/img/barberpub.jpg",
    responsavel: "Carlos Silva",
    email: "barberpub@email.com",
    categoria: "pub",
    cep: "",
    logradouro: "Rua do Carmo",
    numero: "131",
    bairro: "Centro",
    cidade: "Sabará",
    uf: "MG",
    avaliacao: 4.8,
    avaliacoes: 138,
    horarios: { abertura: "09:00", fechamento: "19:00" },
    dias: ["terca", "quarta", "quinta", "sexta", "sabado"],
    barbeiros: ["Carlos Silva", "João Santos"],
    servicos: [
      { nome: "Corte Masculino", preco: 45 },
      { nome: "Barba / Barboterapia", preco: 35 },
      { nome: "Combo (Corte + Barba)", preco: 70 }
    ],
    criadaEm: "2026-01-01"
  },
  {
    id: "nerybarber",
    nome: "Nery Barber",
    foto: "assets/img/nerybarber.jpg",
    responsavel: "Lucas Nery",
    email: "nerybarber@email.com",
    categoria: "premium",
    cep: "",
    logradouro: "Rua José Maria Moreira",
    numero: "465",
    bairro: "Praia dos Bandeirantes",
    cidade: "Sabará",
    uf: "MG",
    avaliacao: 5,
    avaliacoes: 564,
    horarios: { abertura: "08:30", fechamento: "20:00" },
    dias: ["terca", "quarta", "quinta", "sexta", "sabado"],
    barbeiros: ["Lucas Nery", "Mateus Rocha"],
    servicos: [
      { nome: "Corte Masculino", preco: 50 },
      { nome: "Barba / Barboterapia", preco: 40 },
      { nome: "Sobrancelha", preco: 15 }
    ],
    criadaEm: "2026-01-02"
  }
];

// =====================================================
// 1. ARMAZENAMENTO
// =====================================================

function salvarBarbearias(lista) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));
}

function obterBarbearias() {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);

    if (salvo !== null) {
      const lista = JSON.parse(salvo);

      if (!Array.isArray(lista)) {
        throw new Error("Formato inválido no armazenamento.");
      }

      return lista;
    }

    salvarBarbearias(barbeariasIniciais);
    return [...barbeariasIniciais];

  } catch (erro) {
    console.error(
      "Não foi possível ler os dados. Nenhum dado existente foi apagado.",
      erro
    );

    alert(
      "Não foi possível carregar os cadastros salvos. Confira o console."
    );

    return [];
  }
}

let barbearias = obterBarbearias();

const formulario = document.querySelector("#form-barbearia");
const listaBarbearias = document.querySelector("#lista-barbearias");

// =====================================================
// 2. FUNÇÕES AUXILIARES
// =====================================================

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caractere]);
}

function fotoSegura(valor) {
  const foto = String(valor || "");

  return /^(assets\/img\/[a-z0-9._-]+|data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+)$/i.test(foto)
    ? foto
    : "assets/img/barberpub.jpg";
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function equipe(item) {
  return (Array.isArray(item.barbeiros) ? item.barbeiros : [])
    .map(pessoa =>
      typeof pessoa === "string"
        ? { nome: pessoa, foto: "" }
        : {
            nome: String(pessoa?.nome || ""),
            foto: String(pessoa?.foto || "")
          }
    );
}

function diasNormalizados(item) {
  return (Array.isArray(item.dias) ? item.dias : [])
    .map(dia =>
      String(dia)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    );
}

function mensagem(texto, tipo = "sucesso") {
  const aviso = document.querySelector("#mensagem-form");

  if (aviso) {
    aviso.textContent = texto;
    aviso.dataset.tipo = tipo;
    aviso.setAttribute("role", "status");
  } else {
    alert(texto);
  }
}

// =====================================================
// 3. TRATAMENTO DE IMAGENS
// =====================================================

function imagemReduzida(arquivo, limite = 650) {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith("image/")) {
      return reject(new Error("Escolha um arquivo de imagem."));
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      return reject(new Error("A imagem deve ter até 5 MB."));
    }

    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      try {
        const escala = Math.min(
          1,
          limite / Math.max(imagem.width, imagem.height)
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(
          1,
          Math.round(imagem.width * escala)
        );

        canvas.height = Math.max(
          1,
          Math.round(imagem.height * escala)
        );

        canvas.getContext("2d").drawImage(
          imagem,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(canvas.toDataURL("image/jpeg", 0.65));

      } catch (erro) {
        reject(erro);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagem inválida."));
    };

    imagem.src = url;
  });
}

// =====================================================
// 4. SERVIÇOS DISPONÍVEIS
// =====================================================

const SERVICOS = [
  ["srv-corte", "preco-corte", "Corte Masculino"],
  ["srv-barba", "preco-barba", "Barba / Barboterapia"],
  ["srv-combo", "preco-combo", "Combo (Corte + Barba)"],
  ["srv-sobrancelha", "preco-sobrancelha", "Sobrancelha"]
];

// =====================================================
// 5. PREENCHER FORMULÁRIO NA EDIÇÃO
// =====================================================

function preencherFormulario(item) {
  const valores = {
    "barber-nome": item.nome,
    "barber-resp": item.responsavel,
    "barber-email": item.email,
    "barber-categoria": item.categoria || "tradicional",
    "barber-cep": item.cep,
    "barber-logradouro": item.logradouro,
    "barber-numero": item.numero,
    "barber-bairro": item.bairro,
    "barber-cidade": item.cidade,
    "barber-uf": item.uf,
    "hora-abertura": item.horarios?.abertura,
    "hora-fechamento": item.horarios?.fechamento
  };

  Object.entries(valores).forEach(([id, valor]) => {
    const campo = document.getElementById(id);

    if (campo) {
      campo.value = valor ?? "";
    }
  });

  equipe(item).slice(0, 3).forEach((pessoa, indice) => {
    const partes = pessoa.nome.trim().split(/\s+/);

    document.getElementById(
      `barbeiro${indice + 1}-nome`
    ).value = partes.shift() || "";

    document.getElementById(
      `barbeiro${indice + 1}-sobrenome`
    ).value = partes.join(" ");
  });

  const dias = diasNormalizados(item);

  document.querySelectorAll('input[name="dias"]')
    .forEach(campo => {
      campo.checked = dias.includes(campo.value);
    });

  SERVICOS.forEach(([checkId, precoId, nome]) => {
    const servico = (item.servicos || [])
      .find(s => s.nome === nome);

    document.getElementById(checkId).checked = Boolean(servico);

    if (servico) {
      document.getElementById(precoId).value = servico.preco;
    }
  });

  document.querySelector("main h2").textContent =
    "Editar Barbearia";

  document.querySelector(
    '#form-barbearia button[type="submit"]'
  ).textContent = "Salvar Alterações";

  document.getElementById("barber-foto").required = false;

  if (!item.cep) {
    document.getElementById("barber-cep").required = false;
  }

  document.getElementById("barber-senha").required = false;

  document.getElementById("barber-senha").placeholder =
    "Não é necessário informar na edição";
}

// =====================================================
// 6. CONSULTAR CEP
// =====================================================

async function consultarCEP() {
  const cep = document.getElementById("barber-cep")
    .value.replace(/\D/g, "");

  if (cep.length !== 8) {
    return mensagem("Digite um CEP com 8 números.", "erro");
  }

  const botao = document.getElementById("buscar-cep");

  botao.disabled = true;
  botao.textContent = "Consultando...";

  try {
    const resposta = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`
    );

    if (!resposta.ok) {
      throw new Error("Falha na consulta ao ViaCEP.");
    }

    const dados = await resposta.json();

    if (dados.erro) {
      throw new Error("CEP não encontrado.");
    }

    const endereco = {
      "barber-logradouro": dados.logradouro,
      "barber-bairro": dados.bairro,
      "barber-cidade": dados.localidade,
      "barber-uf": dados.uf
    };

    for (const [id, valor] of Object.entries(endereco)) {
      document.getElementById(id).value = valor || "";
    }

    mensagem(
      "Endereço encontrado! Confira o número e os demais dados."
    );

  } catch (erro) {
    mensagem(
      erro.message || "Não foi possível consultar o CEP.",
      "erro"
    );
  } finally {
    botao.disabled = false;
    botao.textContent = "Buscar CEP";
  }
}

// =====================================================
// 7. CADASTRAR E EDITAR BARBEARIAS
// =====================================================

if (formulario) {
  const idEdicao = new URLSearchParams(location.search).get("id");

  const existente = idEdicao
    ? barbearias.find(item => item.id === idEdicao)
    : null;

  if (idEdicao && !existente) {
    mensagem(
      "Barbearia não encontrada. Volte à página inicial.",
      "erro"
    );

    formulario.querySelector(
      'button[type="submit"]'
    ).disabled = true;

  } else if (existente) {
    preencherFormulario(existente);
  }

  document.getElementById("buscar-cep")
    .addEventListener("click", consultarCEP);

  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    if (!formulario.reportValidity()) {
      return;
    }

    const dados = new FormData(formulario);
    const dias = dados.getAll("dias");

    if (!dias.length) {
      return mensagem(
        "Selecione pelo menos um dia de atendimento.",
        "erro"
      );
    }

    if (
      dados.get("hora_fechamento") <=
      dados.get("hora_abertura")
    ) {
      return mensagem(
        "O horário de fechamento deve ser posterior à abertura.",
        "erro"
      );
    }

    const servicos = SERVICOS
      .filter(([checkId]) =>
        document.getElementById(checkId).checked
      )
      .map(([, precoId, nome]) => ({
        nome,
        preco: Number(document.getElementById(precoId).value)
      }));

    if (!servicos.length) {
      return mensagem(
        "Selecione pelo menos um serviço.",
        "erro"
      );
    }

    if (servicos.some(servico =>
      !Number.isFinite(servico.preco) || servico.preco < 0
    )) {
      return mensagem(
        "Informe preços válidos para os serviços selecionados.",
        "erro"
      );
    }

    const botao = formulario.querySelector(
      'button[type="submit"]'
    );

    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {
      const arquivo = document.getElementById(
        "barber-foto"
      ).files[0];

      const foto = arquivo
        ? await imagemReduzida(arquivo)
        : existente?.foto || "";

      if (!foto) {
        throw new Error("Selecione uma foto da barbearia.");
      }

      const barbeiros = [];
      const anteriores = existente ? equipe(existente) : [];

      for (let i = 1; i <= 3; i++) {
        const nome = (
          document.getElementById(`barbeiro${i}-nome`).value +
          " " +
          document.getElementById(`barbeiro${i}-sobrenome`).value
        ).trim();

        const arquivoPessoa = document.getElementById(
          `barbeiro${i}-foto`
        ).files[0];

        if (nome) {
          const fotoPessoa = arquivoPessoa
            ? await imagemReduzida(arquivoPessoa, 300)
            : anteriores[i - 1]?.foto || "";

          barbeiros.push({
            nome,
            foto: fotoPessoa
          });
        }
      }

      const registro = {
        id: existente?.id ||
          (window.crypto?.randomUUID?.() || String(Date.now())),

        nome: String(dados.get("nome_barbearia")).trim(),
        foto,

        responsavel: String(dados.get("responsavel")).trim(),
        email: String(dados.get("email")).trim(),
        categoria: String(dados.get("categoria")),

        cep: String(dados.get("cep")).replace(/\D/g, ""),
        logradouro: String(dados.get("logradouro")).trim(),
        numero: String(dados.get("numero")).trim(),
        bairro: String(dados.get("bairro")).trim(),
        cidade: String(dados.get("cidade")).trim(),
        uf: String(dados.get("uf")).trim().toUpperCase(),

        avaliacao: existente?.avaliacao ?? 0,
        avaliacoes: existente?.avaliacoes ?? 0,

        horarios: {
          abertura: String(dados.get("hora_abertura")),
          fechamento: String(dados.get("hora_fechamento"))
        },

        dias,
        barbeiros,
        servicos,

        criadaEm: existente?.criadaEm ||
          new Date().toISOString()
      };

      const atualizadas = existente
        ? barbearias.map(item =>
            item.id === existente.id ? registro : item
          )
        : [...barbearias, registro];

      salvarBarbearias(atualizadas);
      barbearias = atualizadas;

      mensagem(
        existente
          ? "Barbearia atualizada com sucesso!"
          : "Barbearia cadastrada com sucesso!"
      );

      setTimeout(() => {
        location.href = "../index.html";
      }, 700);

    } catch (erro) {
      console.error(erro);

      mensagem(
        "Não foi possível salvar. Verifique as imagens e o espaço do navegador.",
        "erro"
      );

      botao.disabled = false;

      botao.textContent = existente
        ? "Salvar Alterações"
        : "Concluir e Cadastrar Barbearia";
    }
  });
}

// =====================================================
// 8. LISTAGEM, PESQUISA, FILTRO E ORDENAÇÃO
// =====================================================

function renderizarBarbearias() {
  if (!listaBarbearias) return;

  const busca = (
    document.getElementById("busca")?.value || ""
  ).toLocaleLowerCase("pt-BR").trim();

  const categoria = document.getElementById(
    "filtro-categoria"
  )?.value || "todas";

  const ordenacao = document.getElementById(
    "ordenacao"
  )?.value || "nome";

  const resultado = barbearias.filter(item =>
    (
      String(item.nome || "")
        .toLocaleLowerCase("pt-BR")
        .includes(busca) ||
      String(item.cidade || "")
        .toLocaleLowerCase("pt-BR")
        .includes(busca)
    ) &&
    (
      categoria === "todas" ||
      item.categoria === categoria ||
      (categoria === "tradicional" && item.categoria === "pub")
    )
  );

  if (ordenacao === "nome") {
    resultado.sort((a, b) =>
      String(a.nome).localeCompare(String(b.nome), "pt-BR")
    );
  }

  if (ordenacao === "avaliacao") {
    resultado.sort((a, b) =>
      Number(b.avaliacao || 0) -
      Number(a.avaliacao || 0)
    );
  }

  if (ordenacao === "recentes") {
    resultado.sort((a, b) =>
      new Date(b.criadaEm || 0) -
      new Date(a.criadaEm || 0)
    );
  }

  listaBarbearias.querySelectorAll("article")
    .forEach(cartao => cartao.remove());

  document.getElementById("estado-lista").textContent =
    resultado.length
      ? `${resultado.length} barbearia(s) encontrada(s).`
      : "Nenhuma barbearia encontrada.";

  resultado.forEach(item => {
    const cartao = document.createElement("article");
    const horario = item.horarios || {};

    cartao.innerHTML = `
      <figure>
        <img
          src="${escaparHTML(fotoSegura(item.foto))}"
          alt="Foto de ${escaparHTML(item.nome)}"
        >
      </figure>

      <h3>${escaparHTML(item.nome)}</h3>

      <p>
        <strong>Endereço:</strong>
        ${escaparHTML(item.logradouro)},
        ${escaparHTML(item.numero)} -
        ${escaparHTML(item.bairro)},
        ${escaparHTML(item.cidade)}
      </p>

      <p>
        <strong>Avaliação:</strong>
        ${Number(item.avaliacao || 0).toFixed(1)}
        (${Number(item.avaliacoes || 0)} avaliações)
      </p>

      <p>
        <strong>Horário:</strong>
        ${escaparHTML(horario.abertura || "--:--")}
        às
        ${escaparHTML(horario.fechamento || "--:--")}
      </p>

      <p>
        <strong>Equipe de Barbeiros:</strong>
        ${equipe(item).map(p =>
          escaparHTML(p.nome)
        ).join(", ") || "Não informada"}
      </p>

      <p><strong>Serviços e Valores:</strong></p>

      <ul>
        ${(item.servicos || []).map(s => `
          <li>
            ${escaparHTML(s.nome)} - ${moeda(s.preco)}
          </li>
        `).join("")}
      </ul>

      <p>
        <button type="button" data-acao="detalhes">
          Ver detalhes
        </button>

        <a href="pages/cadastroBarbearia.html?id=${encodeURIComponent(item.id)}">
          Editar
        </a>

        <button type="button" data-acao="excluir">
          Excluir
        </button>
      </p>
    `;

    cartao.querySelector('[data-acao="detalhes"]')
      .addEventListener("click", () =>
        visualizarDetalhes(item.id)
      );

    cartao.querySelector('[data-acao="excluir"]')
      .addEventListener("click", () =>
        excluirBarbearia(item.id)
      );

    listaBarbearias.appendChild(cartao);
  });
}

// =====================================================
// 9. VISUALIZAR DETALHES
// =====================================================

function visualizarDetalhes(id) {
  const item = barbearias.find(b => b.id === id);

  if (!item) return;

  const dialogo = document.createElement("dialog");

  dialogo.style.cssText =
    "width:min(92vw,650px);max-height:85vh;overflow:auto;" +
    "padding:1.5rem;border:1px solid #e5e7eb;" +
    "border-radius:14px";

  dialogo.innerHTML = `
    <h2>${escaparHTML(item.nome)}</h2>

    <p>
      <strong>Responsável:</strong>
      ${escaparHTML(item.responsavel)}
    </p>

    <p>
      <strong>E-mail:</strong>
      ${escaparHTML(item.email)}
    </p>

    <p>
      <strong>Categoria:</strong>
      ${escaparHTML(item.categoria || "Não informada")}
    </p>

    <p>
      <strong>Endereço:</strong>
      ${escaparHTML(item.logradouro)},
      ${escaparHTML(item.numero)} -
      ${escaparHTML(item.bairro)},
      ${escaparHTML(item.cidade)} /
      ${escaparHTML(item.uf)}
    </p>

    <p>
      <strong>Horário:</strong>
      ${escaparHTML(item.horarios?.abertura || "")}
      às
      ${escaparHTML(item.horarios?.fechamento || "")}
    </p>

    <p>
      <strong>Dias:</strong>
      ${diasNormalizados(item).map(escaparHTML).join(", ")}
    </p>

    <p>
      <strong>Equipe:</strong>
      ${equipe(item).map(p =>
        escaparHTML(p.nome)
      ).join(", ")}
    </p>

    <h3>Serviços</h3>

    <ul>
      ${(item.servicos || []).map(s => `
        <li>
          ${escaparHTML(s.nome)} - ${moeda(s.preco)}
        </li>
      `).join("")}
    </ul>

    <button type="button" id="fechar-detalhes">
      Fechar
    </button>
  `;

  document.body.appendChild(dialogo);

  dialogo.addEventListener("close", () =>
    dialogo.remove()
  );

  dialogo.querySelector("#fechar-detalhes")
    .addEventListener("click", () =>
      dialogo.close()
    );

  dialogo.showModal();
}

// =====================================================
// 10. EXCLUIR BARBEARIA
// =====================================================

function excluirBarbearia(id) {
  const item = barbearias.find(b => b.id === id);

  if (!item || !confirm(
    `Deseja realmente excluir ${item.nome}?`
  )) {
    return;
  }

  const atualizadas = barbearias.filter(
    b => b.id !== id
  );

  try {
    salvarBarbearias(atualizadas);
    barbearias = atualizadas;
    renderizarBarbearias();

  } catch (erro) {
    console.error(erro);
    alert("Não foi possível excluir a barbearia.");
  }
}

// =====================================================
// 11. EVENTOS DA DASHBOARD
// =====================================================

if (listaBarbearias) {
  document.querySelector('form[action="index.html"]')
    .addEventListener("submit", evento => {
      evento.preventDefault();
      renderizarBarbearias();
    });

  document.getElementById("busca")
    .addEventListener("input", renderizarBarbearias);

  document.getElementById("filtro-categoria")
    .addEventListener("change", renderizarBarbearias);

  document.getElementById("ordenacao")
    .addEventListener("change", renderizarBarbearias);

  window.addEventListener("storage", evento => {
    if (evento.key === CHAVE_STORAGE) {
      barbearias = obterBarbearias();
      renderizarBarbearias();
    }
  });

  renderizarBarbearias();
}
