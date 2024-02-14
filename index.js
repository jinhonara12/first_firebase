import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    databaseURL: process.env.databaseURL,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId
};

/*
데이터베이스 연결
1. 파이어베이스로 데이터베이스를 생성
2. 노션 api로 가져온 데이터를 파이어베이스 데이터베이스에 저장 또는 직접 연결
    💬 노션에서 파이어데이터베이스로 접속하기 위한 권한 문제
        -> 데이터베이스 권한 부여
3. 파이어베이스 SDK로 홈페이지에 출력
*/

const app = initializeApp(firebaseConfig);
const database = getDatabase(app)

// 데이터배이스 권한
const auth = getAuth();
const email = process.env.GOOGLE_ID;
const password = process.env.GOOGLE_PW;

signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // 로그인 성공
        const user = userCredential.user;

    })
    .catch((error) => {
        // 로그인 실패
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("로그인 실패", errorCode, errorMessage);
    });


// 노션 데이터 가져오기
const NOTION_KEY = process.env.NOTION_KEY;
const FEST_KEY = process.env.NOTION_FEST_ID;
const NOTION = new Client({ auth: NOTION_KEY });

const getPageProperty = async (id_array) => {
    const PROPERTY_OBJECT = [];
    for (let i = 0; i < id_array.length; i++) {
        const DATA_TYPE_ARRAY = [];
        const response = await NOTION.pages.retrieve({ page_id: id_array[i].id })
            .then(data => {
                data.properties.type.multi_select.forEach((el) => { DATA_TYPE_ARRAY.push(el.name) })
                PROPERTY_OBJECT.push({
                    title: data.properties.name.title[0].plain_text,
                    start_date: data.properties.date.date ? data.properties.date.date.start : '',
                    end_date: data.properties.date.date && data.properties.date.date.end ? data.properties.date.date.end : '',
                    d_date: data.properties.d_day.formula.string ? data.properties.d_day.formula.string : "",
                    Alink: data.properties.Alink.url ? data.properties.Alink.url : '',
                    Clink: data.properties.Clink.url ? data.properties.Clink.url : '',
                    emoji: data.icon ? data.icon.emoji : '',
                    type: DATA_TYPE_ARRAY
                })
            })
    }
    set(ref(database, 'notionData'), PROPERTY_OBJECT);
    console.timeEnd('데이터 업로드')
}

const getPgaeID = (result_array) => {
    const ID_ARRAY = [];
    result_array.forEach((el) => {
        let { id } = el
        ID_ARRAY.push({ id })
    })
    getPageProperty(ID_ARRAY)
}

const getFestPages = async (req, res) => {
    const response = await NOTION.databases.query({
        database_id: FEST_KEY,
        sorts: [{
            property: 'date',
            direction: 'ascending'
            // direction: 'descending',

        }]
    });

    getPgaeID(response.results);
}
console.time('데이터 업로드')
getFestPages()