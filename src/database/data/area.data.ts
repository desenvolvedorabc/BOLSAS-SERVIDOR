import { CredentialRole } from 'src/modules/user/model/enum/role.enum';

interface Area {
  name: string;
  tag: string;
  role: CredentialRole;
}

export const areaData: Area[] = [
  {
    name: 'Estados Parceiros',
    tag: 'EST_PAR',
    role: CredentialRole.PARC,
  },
  {
    name: 'Home',
    tag: 'HOME',
    role: CredentialRole.PARC,
  },
  {
    name: 'Logs do Sistema',
    tag: 'LOGS',
    role: CredentialRole.PARC,
  },
  {
    name: 'Minha Conta',
    tag: 'USU_ADM',
    role: CredentialRole.PARC,
  },
  {
    name: 'Perfis de Usuário',
    tag: 'PER_USU',
    role: CredentialRole.PARC,
  },
  {
    name: 'Usuários Admin',
    tag: 'USU_ADM',
    role: CredentialRole.PARC,
  },
  {
    name: 'Usuários Estados',
    tag: 'USU_EST',
    role: CredentialRole.PARC,
  },
  {
    name: 'Usuários Admin',
    tag: 'USU_ADM',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Regionais Parceiras',
    tag: 'REG_PAR',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Perfis de Acesso',
    tag: 'PER_ACE',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Minha Conta',
    tag: 'MIN_CON',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Planos de Trabalho',
    tag: 'PLN_TRAB',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Aprovações de Planos de Trabalho',
    tag: 'APRO_PLN_TRAB',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Relatórios Mensais',
    tag: 'REL_MES',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Aprovação de Relatórios',
    tag: 'APRO_REL',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Termo de Adesão',
    tag: 'TER_ADS',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Assinatura do Termo de Adesão',
    tag: 'ASS_ADS',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Desistência do Termo de Adesão',
    tag: 'DES_ADS',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Remessa Bancária',
    tag: 'REM_BAN',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Envio de Mensagens',
    tag: 'ENV_MEN',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Recebimento de Mensagens',
    tag: 'REC_MEN',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Envio de Notificações',
    tag: 'ENV_NOT',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Recebimento de Notificações',
    tag: 'REC_NOT',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Pré Cadastro do Bolsistas',
    tag: 'PRE_CAD_BOL',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Cadastro Completo do Bolsistas',
    tag: 'CAD_COM_BOL',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Aprovação de Cadastro do Bolsista',
    tag: 'APRO_CAD_BOL',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Logs do Sistema',
    tag: 'LOG_ST',
    role: CredentialRole.ESTADO,
  },

  {
    name: 'Receitas Anuais',
    tag: 'REC_ANO',
    role: CredentialRole.ESTADO,
  },
];
