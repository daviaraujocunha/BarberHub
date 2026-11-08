
"use strict";

/*
  BarberHub - Interface da sessão demonstrativa
*/

document.addEventListener("DOMContentLoaded", () => {
  const CHAVE_SESSAO = "barberhub_sessao_demo";

  const linkEntrar = document.getElementById("menu-entrar");
  const areaUsuario = document.getElementById("area-usuario");
  const mensagem = document.getElementById("saudacao-usuario");
  const botaoSair = document.getElementById("botao-sair");

  let sessao = null;

  try {
    sessao = JSON.parse(
      sessionStorage.getItem(CHAVE_SESSAO) || "null"
    );
  } catch {
    sessionStorage.removeItem(CHAVE_SESSAO);
  }

  if (sessao && sessao.demonstracao && sessao.nome) {
    // Esconde a opção Entrar
    if (linkEntrar) {
      linkEntrar.hidden = true;
    }

    // Mostra a identificação do cliente
    if (areaUsuario) {
      areaUsuario.hidden = false;
    }

    if (mensagem) {
      const primeiroNome = String(sessao.nome)
        .trim()
        .split(/\s+/)[0];

      mensagem.textContent =
        `Seja bem-vindo, ${primeiroNome}!`;
    }

  } else {
    if (linkEntrar) {
      linkEntrar.hidden = false;
    }

    if (areaUsuario) {
      areaUsuario.hidden = true;
    }
  }

  // Sair da sessão

  if (botaoSair) {
    botaoSair.addEventListener("click", () => {
      sessionStorage.removeItem(CHAVE_SESSAO);
      location.href = "index.html";
    });
  }
});
