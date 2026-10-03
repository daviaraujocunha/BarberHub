# BarberHub 💈

O **BarberHub** é um sistema web de gerenciamento e agendamento para barbearias desenvolvido com HTML5 semântico.

## 🚀 Funcionalidades

- **Listagem de Barbearias:** Destaque para estabelecimentos da região (Barber Pub e Nery Barber) contendo fotos, endereço, horários de funcionamento, equipe de barbeiros e tabela de preços.
- **Fluxo de Cadastro Dinâmico:** Central de escolha entre Cliente e Barbearia, formulário de usuário com consulta de endereço via ViaCEP e onboarding completo de estabelecimentos (dados, upload de fotos, equipe, horários e serviços).
- **Agendamento de Horários:** Páginas de detalhes personalizadas para cada barbearia (`detalhesBarberPub.html` e `detalhesNeryBarber.html`), permitindo selecionar o serviço, profissional da equipe, data e horário.
- **Confirmação de Reserva:** Tela de confirmação simulando a emissão do comprovante e o envio de e-mail ao cliente.

## 📁 Estrutura do Projeto

```text
/
├── index.html                   # Página principal com a listagem das barbearias
├── README.md                    # Documentação do projeto
├── assets/                      # Imagens das barbearias e profissionais
└── pages/                       # Páginas secundárias do fluxo
    ├── cadastro.html            # Hub para escolha de tipo de cadastro
    ├── cadastroUsuario.html     # Formulário de cadastro de cliente
    ├── cadastroBarbearia.html   # Form/Onboarding completo de barbearia
    ├── detalhesBarberPub.html   # Agendamento específico da Barber Pub
    ├── detalhesNeryBarber.html  # Agendamento específico da Nery Barber
    └── confirmacaoCadastro.html # Tela de confirmação do cadastro/agendamento