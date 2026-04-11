# Guia para Criar o App Android (Exu do Ouro)

Este projeto utiliza o **Capacitor**, que é a ferramenta mais moderna e recomendada para transformar aplicações React em aplicativos nativos para Android e iOS.

## Pré-requisitos
1. **Node.js** instalado no seu computador.
2. **Android Studio** instalado e configurado.
3. **Java JDK 17+** instalado.

---

## Passo a Passo para Gerar o APK

### 1. Preparar o Projeto
No terminal do seu computador (dentro da pasta do projeto), execute:
```bash
# Instalar as dependências
npm install

# Gerar a versão de produção do site
npm run build
```

### 2. Adicionar a Plataforma Android
Execute o comando para criar a pasta nativa do Android:
```bash
npx cap add android
```

### 3. Sincronizar o Código
Sempre que você fizer mudanças no código React e rodar `npm run build`, você precisa sincronizar com o Android:
```bash
npx cap sync
```

### 4. Abrir no Android Studio
Para gerar o APK final ou testar em um emulador:
```bash
npx cap open android
```
*Isso abrirá o Android Studio automaticamente com o seu projeto.*

### 5. Gerar o APK / Bundle
Dentro do Android Studio:
1. Vá em **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. O Android Studio irá processar e mostrar uma notificação com o link "locate" para abrir a pasta com o seu arquivo `.apk`.

---

## Dicas de Personalização

### Ícone e Splash Screen
Para gerar ícones e telas de abertura automaticamente em todos os tamanhos, você pode usar o `cordova-res` ou o `@capacitor/assets`:
```bash
npm install @capacitor/assets -D
npx capacitor-assets generate --android
```
*Coloque um arquivo `icon.png` e `splash.png` na raiz do projeto antes de rodar.*

### Permissões
Se precisar de permissões específicas (Câmera, Localização), edite o arquivo:
`android/app/src/main/AndroidManifest.xml`

---

## Comandos Úteis
- `npx cap copy`: Copia apenas os arquivos da web para o app.
- `npx cap update`: Atualiza os plugins nativos.
- `npx cap run android`: Roda o app direto em um celular conectado via USB.
