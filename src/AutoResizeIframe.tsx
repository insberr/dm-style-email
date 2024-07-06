import { useEffect, useRef } from 'preact/compat';

// Function to decode base64 to UTF-8
// This converts all those weird characters back into what they should be
const base64ToUtf8 = (base64: string) => {
    const binaryString = atob(base64);
    return new TextDecoder('utf-8').decode(Uint8Array.from(binaryString, char => char.charCodeAt(0)));
};

export default function AutoResizeIframe(props: { src: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.style.height = "100px";

            let iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDocument) {
                const decodedHtml = base64ToUtf8(props.src);

                iframeDocument.open();
                iframeDocument.write(decodedHtml);
                iframeDocument.close();

                // Render Raw
                // const div = divRef.current;
                // if (div) {
                //     div.innerHTML = iframeDocument.body.innerHTML;
                //     iframeDocument.open();
                //     iframeDocument.write("");
                //     iframeDocument.close();
                // }

                setTimeout(() => {
                    let height = iframeDocument.body.scrollHeight;
                    // const offset = iframeDocument.body.offsetHeight;
                    // height = Math.min(height, offset);

                    iframe.style.height = (height + 20).toString() + "px";
                }, 500);
            }
        }
    }, [props.src]);

    return (
        <iframe
            ref={iframeRef}
            // scrolling="no"
            style={{
                width: '100%',
                height: '100px',
                border: 'none',
                backgroundColor: 'white',
            }}
            title="Render HTML"
        />
    );
};
