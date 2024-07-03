import {useEffect, useState} from 'preact/hooks'
import preactLogo from './assets/preact.svg'
import viteLogo from '/vite.svg'
import './app.css'
import {googleLogout, TokenResponse, useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
// import FD = FormData from 'form-data'; // this was broken

type GoogleUser = {
    picture: string;
    name: string;
    email:string;
};

export function App() {
  const [count, setCount] = useState(0);
    const [ user, setUser ] = useState<TokenResponse | null>(null);
    const [ profile, setProfile ] = useState<GoogleUser | null>(null);

    const login = useGoogleLogin({
        onSuccess: (codeResponse) => setUser(codeResponse),
        onError: (error) => console.log('Login Failed:', error)
    });

    useEffect(
        () => {
            if (user) {
                axios
                    .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                        headers: {
                            Authorization: `Bearer ${user.access_token}`,
                            Accept: 'application/json'
                        }
                    })
                    .then((res) => {
                        setProfile(res.data);
                    })
                    .catch((err) => console.log(err));

                axios
                    .get(`https://gmail.googleapis.com/gmail/v1/users/me/messages`, {
                        headers: {
                            Authorization: `Bearer ${user.access_token}`,
                            Accept: 'application/json'
                        }
                    })
                    .then((res) => {
                        // We have the list of messages now. Time to fetch them all using a batch request.
                        console.log(res);

                        const endpoint = 'https://www.googleapis.com/batch/gmail/v1/';
                        const form = new FormData();
                        res.data.messages.forEach((msg: { id: string; threadId: string; } )=> {
                                form.append('requests', JSON.stringify(
                                    {
                                        method: 'GET',
                                        path: `/gmail/v1/users/me/messages/${msg.id}`,
                                        headers: {
                                            Authorization: `Bearer ${user.access_token}`,
                                        },
                                    })
                                );
                            }
                        );
                        form.append('Content-Type', 'application/http; msgtype=request');
                        form.append('Content-Transfer-Encoding', 'binary');
                        console.log(form);
                        axios.post(endpoint, form, { headers:
                                {
                                    Authorization: `Bearer ${user.access_token}`,
                                    ...form.getHeaders(),
                                }
                        })
                            .then(response => {
                                // Handle successful response
                                console.log('Batch request successful:', response.data);
                            })
                            .catch(error => {
                                // Handle error
                                console.error('Batch request error:', error);
                            });

//
//                         const your_auth_token = 'your_auth_token_here';
//                         const boundary = 'batch_foobarbaz';
//                         let total_content_length = 0; // Initialize total_content_length
//
//                         const messages = [
//                             { id: "message_id_1", threadId: "thread_id_1" },
//                             { id: "message_id_2", threadId: "thread_id_2" },
//                             // Add more messages as needed
//                         ];
//
// // Calculate total content length based on the number of messages
//                         messages.forEach(message => {
//                             total_content_length += getPartContentLength(message);
//                         });
//
//                         function getPartContentLength(message) {
//                             const partContent = `GET /gmail/v1/users/me/messages/${message.id}?format=full`;
//                             return partContent.length;
//                         }
//
//                         function createBatchRequest(messages) {
//                             let requestBody = '';
//
//                             messages.forEach((message, index) => {
//                                 const partContent = `GET /gmail/v1/users/me/messages/${message.id}?format=full`;
//
//                                 requestBody += `--${boundary}
// Content-Type: application/http
// Content-ID: <item${index + 1}:${message.threadId}@gmail.com>
//
// ${partContent}\n`;
//                             });
//
//                             requestBody += `--${boundary}--`;
//
//                             return requestBody;
//                         }
//
//                         const requestBody = createBatchRequest(messages);
//
//                         const requestOptions = {
//                             method: 'POST',
//                             headers: {
//                                 'Authorization': `Bearer ${user.access_token}`,
//                                 'Host': 'www.googleapis.com',
//                                 'Content-Type': `multipart/mixed; boundary=${boundary}`,
//                                 'Content-Length': total_content_length
//                             },
//                             body: requestBody
//                         };

                        // fetch('https://www.googleapis.com/batch/gmail/v1', requestOptions)
                        //     .then(response => response.text())
                        //     .then(result => console.log(result))
                        //     .catch(error => console.log('error', error));

                        // axios.post('https://www.googleapis.com/batch/gmail/v1/users/me/messages', requestOptions)
                        //     .then((res) => {
                        //         console.log(res);
                        //     }).catch((err) => {
                        //         console.log(err);
                        // });

                        // axios
                        //     .get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/`, {
                        //         headers: {
                        //             Authorization: `Bearer ${user.access_token}`,
                        //             Accept: 'application/json',
                        //             format: 'full'
                        //         }
                        //     })
                        //     .then((res) => {
                        //         console.log(res);
                        //     })
                        //     .catch((err) => console.log(err));
                    })
                    .catch((err) => console.log(err));
            }
        },
        [ user ]
    );
// log out function to log the user out of google and set the profile array to null
    const logOut = () => {
        googleLogout();
        setProfile(null);
    };

    return (
      <>
          <div>
              <a href="https://vitejs.dev" target="_blank">
                  <img src={viteLogo} class="logo" alt="Vite logo"/>
              </a>
              <a href="https://preactjs.com" target="_blank">
                  <img src={preactLogo} class="logo preact" alt="Preact logo"/>
              </a>
          </div>
          <h1>Vite + Preact</h1>
          <div class="card">
              <button onClick={() => setCount((count) => count + 1)}>
                  count is {count}
              </button>
              <p>
                  <code>src/app.tsx</code> and save to test HMR
              </p>
          </div>
          <p class="read-the-docs">
              Click on the Vite and Preact logos to learn more
          </p>
          {profile ? (
              <div>
                  <img src={profile.picture} alt="user image" />
                  <h3>User Logged in</h3>
                  <p>Name: {profile.name}</p>
                  <p>Email Address: {profile.email}</p>
                  <br />
                  <br />
                  <button onClick={logOut}>Log out</button>
              </div>
          ) : (
              <button onClick={login}>Sign in with Google 🚀 </button>
          )}
      </>
)
}
