/* =====================================================
   BARBERHUB
   Cadastro, listagem, pesquisa, filtros, edição e exclusão
   Armazenamento: localStorage
   API externa: ViaCEP
   ===================================================== */

const CHAVE_STORAGE = "barberhub_barbearias";
const CHAVE_INICIALIZACAO = "barberhub_dados_iniciais";

// =====================================================
// 1. BARBEARIAS QUE JÁ EXISTIAM NO PROJETO
// =====================================================

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
        horarios: {
            abertura: "09:00",
            fechamento: "19:00"
        },
        dias: ["terca", "quarta", "quinta", "sexta", "sabado"],
        barbeiros: [
            "Carlos Silva",
            "João Santos"
        ],
        servicos: [
            { nome: "Corte Masculino", preco: 45 },
            { nome: "Barba / Barboterapia", preco: 35 },
            { nome: "Combo (Corte + Barba)", preco: 70 }
        ],
        criadaEm: "2026-01-01T10:00:00"
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
        avaliacao: 5.0,
        avaliacoes: 564,
        horarios: {
            abertura: "08:30",
            fechamento: "20:00"
        },
        dias: ["terca", "quarta", "quinta", "sexta", "sabado"],
        barbeiros: [
            "Lucas Nery",
            "Mateus Rocha"
        ],
        servicos: [
            { nome: "Corte Masculino", preco: 50 },
            { nome: "Barba / Barboterapia", preco: 40 },
            { nome: "Sobrancelha", preco: 15 }
        ],
        criadaEm: "2026-01-02T10:00:00"
    }
];

// =====================================================
// 2. LOCALSTORAGE
// =====================================================

function obterBarbearias() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

    if (dadosSalvos === null) {
        localStorage.setItem(
            CHAVE_STORAGE,
            JSON.stringify(barbeariasIniciais)
        );

        localStorage.setItem(CHAVE_INICIALIZACAO, "true");

        return [...barbeariasIniciais];
    }

    try {
        const dados = JSON.parse(dadosSalvos);

        // Recupera os dados iniciais uma única vez caso uma versão
        // anterior do sistema tenha gravado uma lista vazia.
        if (
            Array.isArray(dados) &&
            dados.length === 0 &&
            localStorage.getItem(CHAVE_INICIALIZACAO) !== "true"
        ) {
            localStorage.setItem(
                CHAVE_STORAGE,
                JSON.stringify(barbeariasIniciais)
            );

            localStorage.setItem(CHAVE_INICIALIZACAO, "true");

            return [...barbeariasIniciais];
        }

        localStorage.setItem(CHAVE_INICIALIZACAO, "true");

        return Array.isArray(dados) ? dados : [...barbeariasIniciais];

    } catch (erro) {
        console.error("Erro ao recuperar os dados:", erro);

        localStorage.setItem(
            CHAVE_STORAGE,
            JSON.stringify(barbeariasIniciais)
        );

        localStorage.setItem(CHAVE_INICIALIZACAO, "true");

        return [...barbeariasIniciais];
    }
}

function salvarBarbearias() {
    localStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify(barbearias)
    );
}

let barbearias = obterBarbearias();

// =====================================================
// 3. ELEMENTOS DA PÁGINA
// =====================================================

const formulario = document.querySelector("#form-barbearia");
const secaoBarbearias = document.querySelector("#secao-barbearias");
const campoBusca = document.querySelector("#busca");
const filtroCategoria = document.querySelector("#filtro-categoria");
const campoOrdenacao = document.querySelector("#ordenacao");

// =====================================================
// 4. FUNÇÕES AUXILIARES
// =====================================================

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function gerarId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).substring(2);
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function nomeCategoria(categoria) {
    const categorias = {
        tradicional: "Tradicional",
        premium: "Premium",
        pub: "Barber Pub / Bar"
    };

    return categorias[categoria] || "Não informada";
}

function nomeDia(dia) {
    const dias = {
        segunda: "Segunda-feira",
        terca: "Terça-feira",
        quarta: "Quarta-feira",
        quinta: "Quinta-feira",
        sexta: "Sexta-feira",
        sabado: "Sábado",
        domingo: "Domingo"
    };

    return dias[dia] || dia;
}

function mostrarMensagem(texto, tipo = "sucesso") {
    const mensagem = document.querySelector("#mensagem-form");

    if (mensagem) {
        mensagem.textContent = texto;
        mensagem.dataset.tipo = tipo;
        mensagem.style.display = "block";
    } else {
        alert(texto);
    }
}

// =====================================================
// 5. LISTAGEM DAS BARBEARIAS
// =====================================================

function renderizarBarbearias() {
    if (!secaoBarbearias) return;

    // Remove cartões antigos sem remover o título e a mensagem.
    secaoBarbearias.querySelectorAll("article").forEach(cartao => {
        cartao.remove();
    });

    let resultado = [...barbearias];

    const termo = campoBusca
        ? campoBusca.value.toLowerCase().trim()
        : "";

    const categoria = filtroCategoria
        ? filtroCategoria.value
        : "todas";

    const ordenacao = campoOrdenacao
        ? campoOrdenacao.value
        : "nome";

    // Pesquisa.
    if (termo) {
        resultado = resultado.filter(item => {
            const texto = [
                item.nome,
                item.cidade,
                item.bairro,
                item.logradouro
            ].join(" ").toLowerCase();

            return texto.includes(termo);
        });
    }

    // Filtro por categoria.
    if (categoria !== "todas") {
        resultado = resultado.filter(item => {
            return item.categoria === categoria;
        });
    }

    // Ordenação.
    if (ordenacao === "nome") {
        resultado.sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR")
        );
    }

    if (ordenacao === "avaliacao") {
        resultado.sort((a, b) =>
            Number(b.avaliacao) - Number(a.avaliacao)
        );
    }

    if (ordenacao === "recentes") {
        resultado.sort((a, b) =>
            new Date(b.criadaEm) - new Date(a.criadaEm)
        );
    }

    const estadoLista = document.querySelector("#estado-lista");

    if (resultado.length === 0) {
        estadoLista.textContent = "Nenhuma barbearia encontrada.";
        return;
    }

    estadoLista.textContent =
        `${resultado.length} barbearia(s) encontrada(s).`;

    resultado.forEach(item => {
        const cartao = document.createElement("article");

        const imagem = item.foto || "assets/img/barberpub.jpg";

        const listaBarbeiros = (item.barbeiros || [])
            .map(nome => `<li>${escaparHTML(nome)}</li>`)
            .join("");

        const listaServicos = (item.servicos || [])
            .map(servico => `
                <li>
                    ${escaparHTML(servico.nome)}
                    - ${formatarPreco(servico.preco)}
                </li>
            `)
            .join("");

        const dias = (item.dias || [])
            .map(nomeDia)
            .join(", ");

        cartao.innerHTML = `
            <figure>
                <img
                    src="${escaparHTML(imagem)}"
                    alt="Foto da fachada da ${escaparHTML(item.nome)}"
                    width="300"
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
                <strong>Categoria:</strong>
                ${nomeCategoria(item.categoria)}
            </p>

            <p>
                <strong>Horário de Funcionamento:</strong>
                ${escaparHTML(dias)},
                das ${escaparHTML(item.horarios?.abertura || "--:--")}
                às ${escaparHTML(item.horarios?.fechamento || "--:--")}
            </p>

            <p><strong>Equipe de Barbeiros:</strong></p>

            <ul>
                ${listaBarbeiros || "<li>Não informado</li>"}
            </ul>

            <p><strong>Serviços e Valores:</strong></p>

            <ul>
                ${listaServicos || "<li>Não informado</li>"}
            </ul>

            <p>
                <button
                    type="button"
                    data-acao="detalhes"
                    data-id="${escaparHTML(item.id)}"
                >
                    Ver detalhes
                </button>

                <a href="pages/cadastroBarbearia.html?id=${encodeURIComponent(item.id)}">
                    Editar
                </a>

                <button
                    type="button"
                    data-acao="excluir"
                    data-id="${escaparHTML(item.id)}"
                >
                    Excluir
                </button>
            </p>
        `;

        secaoBarbearias.appendChild(cartao);
    });
}

// =====================================================
// 6. PESQUISA, FILTRO E ORDENAÇÃO
// =====================================================

const formularioPesquisa = document.querySelector("#form-pesquisa");

if (formularioPesquisa) {
    formularioPesquisa.addEventListener("submit", evento => {
        evento.preventDefault();
        renderizarBarbearias();
    });
}

if (campoBusca) {
    campoBusca.addEventListener("input", renderizarBarbearias);
}

if (filtroCategoria) {
    filtroCategoria.addEventListener("change", renderizarBarbearias);
}

if (campoOrdenacao) {
    campoOrdenacao.addEventListener("change", renderizarBarbearias);
}

// =====================================================
// 7. VISUALIZAR DETALHES
// =====================================================

function visualizarDetalhes(id) {
    const item = barbearias.find(barbearia => barbearia.id === id);

    if (!item) return;

    const janela = document.createElement("dialog");

    const servicos = (item.servicos || [])
        .map(servico => `
            <li>
                ${escaparHTML(servico.nome)}
                - ${formatarPreco(servico.preco)}
            </li>
        `)
        .join("");

    janela.innerHTML = `
        <h2>${escaparHTML(item.nome)}</h2>

        <p><strong>Responsável:</strong> ${escaparHTML(item.responsavel)}</p>
        <p><strong>E-mail:</strong> ${escaparHTML(item.email)}</p>

        <p>
            <strong>Endereço:</strong>
            ${escaparHTML(item.logradouro)}, ${escaparHTML(item.numero)},
            ${escaparHTML(item.bairro)}, ${escaparHTML(item.cidade)}
            - ${escaparHTML(item.uf)}
        </p>

        <p><strong>Categoria:</strong> ${nomeCategoria(item.categoria)}</p>

        <p>
            <strong>Horário:</strong>
            ${escaparHTML(item.horarios?.abertura)}
            às
            ${escaparHTML(item.horarios?.fechamento)}
        </p>

        <p>
            <strong>Dias de atendimento:</strong>
            ${(item.dias || []).map(nomeDia).map(escaparHTML).join(", ")}
        </p>

        <p>
            <strong>Equipe:</strong>
            ${(item.barbeiros || []).map(escaparHTML).join(", ")}
        </p>

        <h3>Serviços</h3>
        <ul>${servicos}</ul>

        <button type="button" data-fechar>Fechar</button>
    `;

    document.body.appendChild(janela);
    janela.showModal();

    janela.querySelector("[data-fechar]").addEventListener("click", () => {
        janela.close();
        janela.remove();
    });

    janela.addEventListener("click", evento => {
        if (evento.target === janela) {
            janela.close();
            janela.remove();
        }
    });
}

// =====================================================
// 8. EXCLUSÃO
// =====================================================

function excluirBarbearia(id) {
    const item = barbearias.find(barbearia => barbearia.id === id);

    if (!item) return;

    const confirmar = confirm(
        `Deseja realmente excluir a barbearia ${item.nome}?`
    );

    if (!confirmar) return;

    barbearias = barbearias.filter(barbearia => barbearia.id !== id);

    salvarBarbearias();
    renderizarBarbearias();
}

// Eventos dos botões dos cartões.
if (secaoBarbearias) {
    secaoBarbearias.addEventListener("click", evento => {
        const botao = evento.target.closest("[data-acao]");

        if (!botao) return;

        const id = botao.dataset.id;

        if (botao.dataset.acao === "detalhes") {
            visualizarDetalhes(id);
        }

        if (botao.dataset.acao === "excluir") {
            excluirBarbearia(id);
        }
    });
}

// =====================================================
// 9. CONVERTER IMAGEM
// =====================================================

function converterImagem(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        leitor.onload = () => {
            const imagem = new Image();

            imagem.onload = () => {
                const canvas = document.createElement("canvas");
                const limite = 700;

                const escala = Math.min(
                    1,
                    limite / Math.max(imagem.width, imagem.height)
                );

                canvas.width = imagem.width * escala;
                canvas.height = imagem.height * escala;

                const contexto = canvas.getContext("2d");

                contexto.drawImage(
                    imagem,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };

            imagem.onerror = reject;
            imagem.src = leitor.result;
        };

        leitor.onerror = reject;
        leitor.readAsDataURL(arquivo);
    });
}

// =====================================================
// 10. PREENCHER FORMULÁRIO PARA EDIÇÃO
// =====================================================

function preencherFormulario(item) {
    const campos = {
        "barber-nome": item.nome,
        "barber-categoria": item.categoria,
        "barber-resp": item.responsavel,
        "barber-email": item.email,
        "barber-cep": item.cep,
        "barber-logradouro": item.logradouro,
        "barber-numero": item.numero,
        "barber-bairro": item.bairro,
        "barber-cidade": item.cidade,
        "barber-uf": item.uf,
        "hora-abertura": item.horarios?.abertura,
        "hora-fechamento": item.horarios?.fechamento
    };

    Object.entries(campos).forEach(([id, valor]) => {
        const campo = document.getElementById(id);

        if (campo) {
            campo.value = valor || "";
        }
    });

    document.querySelectorAll('input[name="dias"]').forEach(campo => {
        campo.checked = (item.dias || []).includes(campo.value);
    });

    const mapaServicos = {
        "Corte Masculino": ["srv-corte", "preco-corte"],
        "Barba / Barboterapia": ["srv-barba", "preco-barba"],
        "Combo (Corte + Barba)": ["srv-combo", "preco-combo"],
        "Sobrancelha": ["srv-sobrancelha", "preco-sobrancelha"]
    };

    Object.values(mapaServicos).forEach(([checkId]) => {
        const check = document.getElementById(checkId);
        if (check) check.checked = false;
    });

    (item.servicos || []).forEach(servico => {
        const camposServico = mapaServicos[servico.nome];

        if (camposServico) {
            document.getElementById(camposServico[0]).checked = true;
            document.getElementById(camposServico[1]).value = servico.preco;
        }
    });

    (item.barbeiros || []).forEach((nomeCompleto, indice) => {
        const partes = nomeCompleto.split(" ");
        const numero = indice + 1;

        const campoNome = document.getElementById(`barbeiro${numero}-nome`);
        const campoSobrenome = document.getElementById(`barbeiro${numero}-sobrenome`);

        if (campoNome) campoNome.value = partes.shift();
        if (campoSobrenome) campoSobrenome.value = partes.join(" ");
    });

    const titulo = document.querySelector("main h2");

    if (titulo) {
        titulo.textContent = "Editar Barbearia";
    }

    const botao = formulario.querySelector('button[type="submit"]');

    if (botao) {
        botao.textContent = "Salvar Alterações";
    }

    const foto = document.querySelector("#barber-foto");

    if (foto) {
        foto.required = false;
    }
}

// =====================================================
// 11. CADASTRO E EDIÇÃO
// =====================================================

if (formulario) {
    const parametros = new URLSearchParams(window.location.search);
    const idEdicao = parametros.get("id");

    const registroExistente = idEdicao
        ? barbearias.find(item => item.id === idEdicao)
        : null;

    if (idEdicao && registroExistente) {
        preencherFormulario(registroExistente);
    }

    if (idEdicao && !registroExistente) {
        mostrarMensagem("Barbearia não encontrada.", "erro");
    }

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        const dados = new FormData(formulario);

        const dias = dados.getAll("dias");

        if (dias.length === 0) {
            mostrarMensagem("Selecione pelo menos um dia de atendimento.", "erro");
            return;
        }

        const servicos = [];

        const servicosDisponiveis = [
            ["srv-corte", "preco-corte", "Corte Masculino"],
            ["srv-barba", "preco-barba", "Barba / Barboterapia"],
            ["srv-combo", "preco-combo", "Combo (Corte + Barba)"],
            ["srv-sobrancelha", "preco-sobrancelha", "Sobrancelha"]
        ];

        for (const [checkboxId, precoId, nome] of servicosDisponiveis) {
            const checkbox = document.getElementById(checkboxId);
            const campoPreco = document.getElementById(precoId);

            if (checkbox.checked) {
                const preco = Number(campoPreco.value);

                if (!Number.isFinite(preco) || preco < 0) {
                    mostrarMensagem("Informe um preço válido para os serviços.", "erro");
                    campoPreco.focus();
                    return;
                }

                servicos.push({ nome, preco });
            }
        }

        if (servicos.length === 0) {
            mostrarMensagem("Selecione pelo menos um serviço.", "erro");
            return;
        }

        const abertura = dados.get("hora_abertura");
        const fechamento = dados.get("hora_fechamento");

        if (fechamento <= abertura) {
            mostrarMensagem(
                "O horário de fechamento deve ser posterior ao horário de abertura.",
                "erro"
            );
            return;
        }

        const barbeiros = [];

        for (let i = 1; i <= 3; i++) {
            const nome = dados.get(`barbeiro${i}_nome`)?.trim() || "";
            const sobrenome = dados.get(`barbeiro${i}_sobrenome`)?.trim() || "";

            if (nome) {
                barbeiros.push(`${nome} ${sobrenome}`.trim());
            }
        }

        let foto = registroExistente?.foto || "assets/img/barberpub.jpg";

        const campoFoto = document.querySelector("#barber-foto");
        const arquivoFoto = campoFoto?.files[0];

        try {
            if (arquivoFoto) {
                if (!arquivoFoto.type.startsWith("image/")) {
                    mostrarMensagem("Selecione um arquivo de imagem válido.", "erro");
                    return;
                }

                foto = await converterImagem(arquivoFoto);
            }

            const novaBarbearia = {
                id: registroExistente ? registroExistente.id : gerarId(),
                nome: dados.get("nome_barbearia").trim(),
                foto,
                responsavel: dados.get("responsavel").trim(),
                email: dados.get("email").trim(),
                categoria: dados.get("categoria"),
                cep: dados.get("cep").replace(/\D/g, ""),
                logradouro: dados.get("logradouro").trim(),
                numero: dados.get("numero").trim(),
                bairro: dados.get("bairro").trim(),
                cidade: dados.get("cidade").trim(),
                uf: dados.get("uf").trim().toUpperCase(),
                avaliacao: registroExistente?.avaliacao || 0,
                avaliacoes: registroExistente?.avaliacoes || 0,
                horarios: {
                    abertura,
                    fechamento
                },
                dias,
                barbeiros,
                servicos,
                criadaEm: registroExistente
                    ? registroExistente.criadaEm
                    : new Date().toISOString()
            };

            if (registroExistente) {
                barbearias = barbearias.map(item =>
                    item.id === registroExistente.id ? novaBarbearia : item
                );
            } else {
                barbearias.push(novaBarbearia);
            }

            salvarBarbearias();

            mostrarMensagem(
                registroExistente
                    ? "Barbearia atualizada com sucesso!"
                    : "Barbearia cadastrada com sucesso!"
            );

            setTimeout(() => {
                window.location.href = "../index.html";
            }, 900);

        } catch (erro) {
            console.error("Erro ao salvar barbearia:", erro);

            mostrarMensagem(
                "Não foi possível salvar. Verifique o tamanho da imagem e tente novamente.",
                "erro"
            );
        }
    });
}

// =====================================================
// 12. CONSULTA DE CEP - VIACEP
// =====================================================

const botaoCEP = document.querySelector("#buscar-cep");

if (botaoCEP) {
    botaoCEP.addEventListener("click", consultarCEP);
}

async function consultarCEP() {
    const campoCEP = document.querySelector("#barber-cep");
    const cep = campoCEP.value.replace(/\D/g, "");

    if (cep.length !== 8) {
        alert("Digite um CEP válido com 8 números.");
        campoCEP.focus();
        return;
    }

    botaoCEP.disabled = true;
    botaoCEP.textContent = "Consultando...";

    try {
        const resposta = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        );

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar o CEP.");
        }

        const endereco = await resposta.json();

        if (endereco.erro) {
            throw new Error("CEP não encontrado.");
        }

        document.querySelector("#barber-logradouro").value =
            endereco.logradouro || "";

        document.querySelector("#barber-bairro").value =
            endereco.bairro || "";

        document.querySelector("#barber-cidade").value =
            endereco.localidade || "";

        document.querySelector("#barber-uf").value =
            endereco.uf || "";

        alert("Endereço preenchido com sucesso!");

    } catch (erro) {
        alert(erro.message || "Erro ao consultar o CEP.");
    } finally {
        botaoCEP.disabled = false;
        botaoCEP.textContent = "Buscar CEP";
    }
}

// =====================================================
// 13. INICIALIZAÇÃO DA PÁGINA
// =====================================================

renderizarBarbearias();