import { create } from 'venom-bot'
import * as dotenv from 'dotenv'
import { Configuration, OpenAIApi } from "openai"

dotenv.config()

create({
    session: 'Chat-GPT',
    multidevice: true
})
    .then((client) => start(client))
    .catch((erro) => {
        console.log(erro);
    });

const configuration = new Configuration({
    organization: process.env.ORGANIZATION_ID,
    apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

const getDavinciResponse = async (clientText) => {
    const options = {
        model: "text-davinci-003", // Modelo GPT a ser usado
        prompt: clientText, // Texto enviado pelo usuário
        temperature: 1, // Nível de variação das respostas geradas, 1 é o máximo
        max_tokens: 4000 // Quantidade de tokens (palavras) a serem retornadas pelo bot, 4000 é o máximo
    }

    try {
        const response = await openai.createCompletion(options)
        let botResponse = ""
        response.data.choices.forEach(({ text }) => {
            botResponse += text
        })
        return `${botResponse.trim()}`
    } catch (e) {
        return `❌ OpenAI Response Error: ${e.response.data.error.message}`
    }
}

const getDalleResponse = async (clientText) => {
    const options = {
        prompt: clientText, // Descrição da imagem
        n: 1, // Número de imagens a serem geradas
        size: "1024x1024", // Tamanho da imagem
    }

    try {
        const response = await openai.createImage(options);
        return response.data.data[0].url
    } catch (e) {
        return `❌ OpenAI Response Error: ${e.response.data.error.message}`
    }
}

const commands = (client, message) => {
    if (message.from === process.env.BOT_NUMBER) return;

    const iaCommands = {
        dalle: "/img"
    }

    let firstWord = message.text.substring(0, message.text.indexOf(" "));

    if (message.text.substring(0, 1) === "/") {
        switch (firstWord) {
            case iaCommands.dalle:
                const imgDescription = message.text.substring(message.text.indexOf(" "));
                getDalleResponse(imgDescription, message).then((imgUrl) => {
                    client.sendImage(
                        message.from === process.env.PHONE_NUMBER ? message.to : message.from,
                        imgUrl,
                        imgDescription,
                        'Imagem gerada pela IA DALL-E'
                    )
                })
                break;

            default:
                client.sendText(message.from, "Comando não reconhecido!")
                break;
        }
    } else {
        getDavinciResponse(message.text).then((response) => {
            client.sendText(message.from, response)
        })
    }
}

async function start(client) {
    client.onAnyMessage((message) => commands(client, message));
}