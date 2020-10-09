const jkurwa = require('jkurwa');
const gost89 = require("gost89");
const buffer = require("Buffer");
const encoding = require('encoding');
const rfc3161 = require('jkurwa/lib/spec/rfc3161-tsp');
const dstszi2010 = require('jkurwa/lib/spec/dstszi2010');
const { Message } = require('jkurwa/lib/models');
const { Priv, Certificate } = require('jkurwa/lib/models');
const transport = require('jkurwa/lib/util/transport');
const xml2js = require('xml2js');


function post(queryUrL, data) {
    // X-Requested-With header enables request to work with cors anywhere, details - https://cors-anywhere.herokuapp.com/
    return fetch(queryUrL, { body: data, method: 'POST', mode: 'cors', headers: { 'X-Requested-With': null } })
        .then((res) => res.arrayBuffer())
        .then((res) => (
            new buffer.Buffer(new Uint8Array(res))
        ));
}

function sign(input, keyfile, cerfile, pass) {

    const add = ({ pubIdx, cert, priv }) => {
        if (!cert && !priv) {
            return {};
        }

        const pub = cert ? cert.pubkey : priv.pub();
        const idx = pub.point.toString();
        let container = pubIdx[idx] || {};
        container.priv = container.priv || priv;
        container.cert = container.cert || cert;
        pubIdx[idx] = container;

        return pubIdx;
    };

    function getCertAndPriv(algo, keyfile, cerfile, pass) {
        let pubIdx = {};
        let keyFileBuffer;
        let certificateBuffer;
        const result = {
            cert: null,
            priv: null
        };

        keyPassword = pass //"tectfom";
        keyFileBuffer = new buffer.Buffer(keyfile, 'base64') //  fs.readFileSync("d:/leon/projects/node/e-rro-master/keyfop/Key-6.dat");


        if (keyFileBuffer[0] === 0x51) {
            keyFileBuffer = keyFileBuffer.slice(6);
        }

        let store;

        try {
            store = Priv.from_protected(keyFileBuffer, keyPassword, algo);
        } catch (ex) {
            console.log(ex.message || ex);
            return result;
        }

        for (let key of store.keys) {
            pubIdx = add({
                pubIdx,
                priv: key
            });
        }

        try {
            certificateBuffer = new buffer.Buffer(cerfile, 'base64') // fs.readFileSync("d:/leon/projects/node/e-rro-master/keyfop/8030938.cer");
        } catch (ex) {
            console.log(ex.message || ex);
            return result;
        }

        pubIdx = add({
            pubIdx,
            cert: Certificate.from_pem(certificateBuffer)
        });

        const [{ cert, priv }] = Object
            .values(pubIdx)
            .filter(ob => ob.cert && ob.priv);

        return {
            cert,
            priv
        };

    }

    function getStamp(cert, hashedMessage) {
        const tsp = rfc3161.TimeStampReq.encode({
            version: 1,
            messageImprint: {
                hashAlgorithm: {
                    algorithm: 'Gost34311'
                },
                hashedMessage: hashedMessage
            }
        }, 'der');

        let res;
        const url = cert.extension.tsp;

        var xhr = new XMLHttpRequest();

        xhr.open('POST', "/tsp-proxy.php", false);


        xhr.send(tsp);

        if (xhr.status != 200) {

            console.log(xhr.status + ': ' + xhr.statusText);
            return null
        } else {

            res = xhr.response;

        }

        buf = buffer.Buffer.from(res, 'base64')

        const rtsp = rfc3161.TimeStampResp.decode(buf, 'der');

        if (rtsp && rtsp.status && (rtsp.status.status !== 'granted')) {
            console.log(`Decoded data is wrong: ${rtsp}`);
            return null;
        }

        return dstszi2010.ContentInfo.encode(rtsp.timeStampToken, 'der');
    }


    const algo = gost89.compat.algos();
    const { cert, priv } = getCertAndPriv(algo, keyfile, cerfile, pass);
    const data = input;
    const dataHash = algo.hash(data);
    const tspB = getStamp(cert, dataHash);

    let msg;

    try {
        msg = new Message({
            type: 'signedData',
            cert,
            data,
            dataHash,
            signer: priv,
            hash: algo.hash,
            tspB,
            signTime: null
        });
    } catch (ex) {
        console.log(ex.message || ex);
    } finally {
        if (!msg) {
            console.log(`Signed message wasn't created`);

        }
    }

    let signedData;

    try {
        const content = msg.as_asn1();
        signedData = content.toString('base64');
        return signedData

    } catch (ex) {
        console.log(ex.message || ex);
        return null
    }

}


function decrypt(body, from1251 = true) {

    function getUnwrapped(data) {
        let msg;
        let content = '';
        let tr;
        const algo = gost89.compat.algos();
        const info = {
            pipe: []
        };

        while (data && data.length) {
            try {
                tr = transport.decode(data);
            } catch (ex) {

                tr = null;
            }

            if (tr) {
                if (tr.header) {
                    info.pipe.push({
                        transport: true,
                        headers: tr.header
                    });
                }

                msg = tr.docs.shift();

                while (msg.type === 'CERTCRYPT') {
                    msg = tr.docs.shift();
                }

                if ((msg.type.substr(3) === '_CRYPT') || (msg.type.substr(3) === '_SIGN')) {
                    data = msg.contents;
                }

                if ((msg.type.substr(0, 3)) === 'QLB' && (tr.docs.length > 0)) {
                    content = tr.docs.shift().contents;
                }

                if ((msg.type === 'DOCUMENT') && (msg.encoding === 'PACKED_XML_DOCUMENT')) {
                    data = msg.contents;
                    continue;
                }
            }

            try {
                msg = new Message(data);
            } catch (ex) {

                if (tr === null) {
                    break;
                }
            }

            if (msg.type === 'signedData') {
                if (msg.info.contentInfo.content === undefined) {
                    if (content === undefined) {
                        info.pipe.push({
                            error: 'ENODATA'
                        });
                        break;
                    }

                    msg.info.contentInfo.content = content;
                }

                const signed = msg.verify(algo.hash);

                if (signed !== true) {
                    // TODO: Fix this place
                    // info.pipe.push({
                    //   broken_sign: true,
                    //   error: 'ESIGN'
                    // });
                    // break;
                    console.error('ESIGN');
                }

                const x = msg.signer();
                data = msg.info.contentInfo.content;

                info.pipe.push({
                    signed,
                    cert: {
                        subject: x.subject,
                        issuer: x.issuer,
                        extension: x.extension,
                        valid: x.valid
                    },
                    signingTime: msg.pattrs.signingTime
                });
            }
        }

        info.content = data;

        if (info.pipe.length && info.pipe[info.pipe.length - 1].error) {
            info.error = info.pipe[info.pipe.length - 1].error;
        }

        return info;
    }

    function processUnwrapped(rpipe = []) {
        const result = {
            isErr: true,
            isWin: false
        };

        for (let step of rpipe) {
            const { cert } = step;
            const tr = step.transport ? step.headers : {};

            if (step.error) {
                console.log(`Error occurred during unwrap: ${step.error}`);
                return result;
            }

            // if (tr.ENCODING === 'WIN') {
            //   result.isWin = true;
            //
            //   Object.keys(tr).forEach(key => {
            //     tr[key] = encoding.convert(tr[key], 'utf8', 'cp1251').toString();
            //   });
            // }


        }

        return Object.assign(result, {
            isErr: false
        });
    }


    try {
        stringifiedBody = buffer.Buffer.from(body, 'base64');
    } catch (ex) {
        console.log('Invalid request body');
        return null
    }


    let content = '';
    let data = buffer.Buffer.from(stringifiedBody);
    const textInfo = getUnwrapped(data);
    const { isErr, isWin } = processUnwrapped(textInfo.pipe || []);
    let result = {
        success: false
    };

    if (!isErr) {
        content = textInfo.content;
        if (from1251) content = require('encoding').convert(content, 'utf-8', 'windows-1251');


        Object.assign(result, {
            success: true,
            data: content.toString('base64')
        });
    }

    return result;

}