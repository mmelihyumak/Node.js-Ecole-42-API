const express = require('express');
const axios = require('axios');
const app = express();

// OAuth 2.0 parametreleri
const CLIENT_ID = 'YOUR_UID';
const CLIENT_SECRET = 'YOUR_SECRET_ID';
const REDIRECT_URI = 'http://localhost:3000/';
const AUTH_URL = 'https://api.intra.42.fr/oauth/authorize';
const TOKEN_URL = 'https://api.intra.42.fr/oauth/token';
const SCOPES = 'public'; // İzin vermek istediğiniz kapsamları belirtin

// Rastgele bir 'state' değeri oluşturun (güvenlik amacıyla)
const generateRandomState = () => {
  return Math.random().toString(36).substring(2, 15);
};
const STATE = generateRandomState();


app.get('/auth', (req, res) => {
  // OAuth 2.0 yetkilendirme URL'sini oluşturun
  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&state=${STATE}&response_type=code`;

  // Kullanıcıyı yetkilendirme ekranına yönlendirin
  res.redirect(authUrl);
});

app.get('/', async (req, res) => {
  const { code, state } = req.query;

  // Güvenlik kontrolü: 'state' değerlerini karşılaştırın
  if (state !== STATE) {
    return res.status(400).send('Hatalı istek: State değeri eşleşmiyor', "state: ", state, "STATE: ", STATE);
  }

  // Erişim belgesi için istek parametrelerini oluşturun
  const tokenParams = new URLSearchParams();
  tokenParams.append('grant_type', 'authorization_code');
  tokenParams.append('client_id', CLIENT_ID);
  tokenParams.append('client_secret', CLIENT_SECRET);
  tokenParams.append('redirect_uri', REDIRECT_URI);
  tokenParams.append('code', code);

  try {
    // Erişim belgesini almak için isteği gönderin
    const tokenResponse = await axios.post(TOKEN_URL, tokenParams);
    const accessToken = tokenResponse.data.access_token;

    // Erişim belgesi ile istenilen API isteğini gönderin (örneğin, '/v2/me' endpoint'i)
    const apiResponse = await axios.get('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // API yanıtını istemciye gönderin
    res.json(apiResponse.data);
  } catch (error) {
    console.error('OAuth Hatası:', error);
    res.status(500).send('OAuth işlemi sırasında bir hata oluştu');
  }
});

// Sunucuyu dinlemeye başlayın
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});