export function formatCPF(cpf: string) {
  //retira os caracteres indesejados...
  const cpfFormatted = cpf.replace(/[^\d]/g, '');

  //realizar a formatação...
  return cpfFormatted.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
