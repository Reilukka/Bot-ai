document.addEventListener('DOMContentLoaded', function() {
    const startButtons = document.querySelectorAll('.startStreaming');
    const stopButtons = document.querySelectorAll('.stopStreaming');
    const liveStreams = document.querySelectorAll('.liveStream');
    const errorMessage = document.getElementById('errorMessage');
    let streaming = {};

    // Verificar se o navegador suporta a mídia de captura
    async function hasCameraAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            return true;
        } catch (error) {
            console.error('Câmera não disponível:', error);
            return false;
        }
    }

    // Iniciar a transmissão
    async function startStreaming(id) {
        if (!streaming[id]) {
            const cameraAvailable = await hasCameraAccess();
            if (!cameraAvailable) {
                errorMessage.textContent = 'Não foi possível iniciar a transmissão. Verifique a câmera do seu dispositivo.';
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                liveStreams[id - 1].srcObject = stream;
                liveStreams[id - 1].play();

                startButtons[id - 1].disabled = true;
                stopButtons[id - 1].disabled = false;

                // Inicia a comunicação com o servidor para o vídeo
                connectToServer(id, stream);
                streaming[id] = stream;
            } catch (error) {
                console.error('Erro ao iniciar a transmissão:', error);
                errorMessage.textContent = 'Não foi possível iniciar a transmissão. Verifique a câmera do seu dispositivo.';
            }
        }
    }

    // Parar a transmissão
    function stopStreaming(id) {
        if (streaming[id]) {
            streaming[id].getTracks().forEach(track => track.stop());
            liveStreams[id - 1].srcObject = null;

            startButtons[id - 1].disabled = false;
            stopButtons[id - 1].disabled = true;

            delete streaming[id];
        }
    }

    // Conectar ao servidor para comunicação em tempo real
    function connectToServer(id, stream) {
        const socket = new WebSocket('ws://your_server_address'); // Substitua "your_server_address" pelo endereço do seu servidor WebSocket

        socket.addEventListener('open', () => {
            console.log('Conexão com o servidor estabelecida.');

            // Envia a stream para o servidor
            const sendStream = (stream) => {
                const videoTrack = stream.getVideoTracks()[0];
                socket.send(videoTrack);
            };

            sendStream(stream);

            // Recebe transmissões do servidor para todas as outras streams
            socket.addEventListener('message', (event) => {
                const incomingStream = new MediaStream([event.data]);
                const streamIndex = event.data.index - 1; // index representa a posição do stream no array
                liveStreams[streamIndex].srcObject = incomingStream;
                liveStreams[streamIndex].play();
            });
        });

        socket.addEventListener('error', (error) => {
            console.error('Erro na comunicação com o servidor:', error);
            errorMessage.textContent = 'Erro na comunicação com o servidor. Por favor, tente novamente mais tarde.';
        });
    }

    // Função para iniciar/encerrar transmissões conforme o botão pressionado
    startButtons.forEach((button, index) => {
        button.addEventListener('click', () => startStreaming(index + 1));
    });

    stopButtons.forEach((button, index) => {
        button.addEventListener('click', () => stopStreaming(index + 1));
    });
});
