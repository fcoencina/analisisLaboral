
const { firefox } = require('playwright');
const fs = require('fs');

async function scrapping() {
    const browser = await firefox.launch({
        headless: true
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    function generarTiempoAleatorio() {
        return Math.random() * 1 + 1;
    }

    const data = [];

    for (let index = 31; index < 71; index++) {
        console.log(`Page ${index}...`);
        await page.goto(`https://www.laborum.cl/empleos.html?page=${index}`);

        try {
            await page.waitForSelector('div[class*="sc-kTCxmr edceSs sc-dHaUqb"] a', {timeout: 30000});
        } catch (error) {
            console.log('La página no se encontró, continuando con la ejecución...');
            continue;
        }

        // Obtener los links de las publicaciones
        const postLinks = await page.evaluate(() => {
            const posts = document.querySelectorAll('div[class*="sc-kTCxmr edceSs sc-dHaUqb"] a');
            const links = [];

            posts.forEach(post => {
                links.push(post.href);
            });

            return links;
        });


        console.log(`Número de links encontrados: ${postLinks.length}`);

        for (let link of postLinks) {
            // Ir a cada link (esto abrirá la oferta en la misma pestaña)
            await page.goto(link);

            try {
                await page.waitForSelector('h1.sc-fDJudH.iRkvio.sc-cQFLBn.gezMea', { timeout: 30000 });
            } catch (error) {
                console.log('La oferta no se encontró, continuando con la ejecución...');
                continue;
            }

            const jobData = await page.evaluate(() => {
                const jobTitle = document.querySelector('h1.sc-fDJudH.iRkvio.sc-cQFLBn.gezMea').textContent.trim();
                const jobCompany = document.querySelector('div.sc-Jrvnx.oOALE')?.textContent.trim() || 'Confidencial';
                const jobDescription = document.querySelector('div.sc-kTCxmr.celKUO')?.textContent.trim() || 'Sin Descripcion';
                const jobExtras = document.querySelectorAll('h2.sc-gqquVF.lbAqov');

                const jobExtrasClean = [];
                for (let item of jobExtras) {
                    jobExtrasClean.push(item.textContent.trim() || 'none');
                }
                const date = jobExtrasClean[0];
                const jobLocation = jobExtrasClean[1];
                const modalidad = jobExtrasClean[2];
                const area = jobExtrasClean[3];
                const EmploymentType = jobExtrasClean[4];
                const SeniorityLevel = jobExtrasClean[5];
                const vacantes = jobExtrasClean[6];

                return {
                    jobTitle, jobCompany, jobLocation, jobDescription, date, area, modalidad, EmploymentType, SeniorityLevel,
                    vacantes
                };
            });

            data.push(jobData);

            await page.waitForTimeout(generarTiempoAleatorio() * 1000);

            // Volver a la página de listado de empleos
            await page.goBack();
        }
    }

    // Guardar los datos en un archivo JSON
    fs.writeFileSync('LaborumJobs.json', JSON.stringify(data, null, 2));

    console.log('Datos guardados en LaborumJobs.json');

    await context.close();
    await browser.close();
}

scrapping();

