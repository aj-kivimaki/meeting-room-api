# ANALYYSI

## 1. Mitä tekoäly teki hyvin?

Tekoäly tuotti nopeasti toimivan perusrungon kokoushuoneiden varausrajapinnalle. Se loi tarvittavat endpointit varausten luontiin, poistoon ja listaukseen sekä käytti SQLite-tietokantaa yksinkertaisella tavalla, jonka ansiosta sovellus oli heti ajettavissa ilman erillistä ympäristön pystytystä.
Perustoiminnallisuus vastasi tehtävänannon vaatimuksia, ja API:n rakenne oli riittävän selkeä jatkokehitystä varten.

Lisäksi tekoäly hyödynsi parametrisoituja SQL-kyselyitä, mikä on hyvä lähtökohta tietoturvan näkökulmasta, ja palautti jo alkuperäisessä toteutuksessa osittain tarkoituksenmukaisia HTTP-statuskoodeja.

## 2. Mitä tekoäly teki huonosti?

Vaikka perustoiminnallisuus oli kunnossa, tekoälyn tuottama ratkaisu sisälsi useita puutteita, jotka olisivat ongelmallisia tuotantokäytössä.

Päällekkäisten varausten tarkistuslogiikka oli toiminnallisesti pääosin oikea, mutta sen toteutus oli vaikeasti luettava ja perustui käänteiseen loogiseen ehtoon (NOT (... OR ...)). Tämä teki koodista vaikeammin ymmärrettävää ja altista virhetulkinnoille jatkokehityksen yhteydessä.

Aikavalidointi oli puutteellista. Vaikka tekoäly tarkisti perusehdot (aloitusajan tulee olla ennen lopetusaikaa ja varaus ei saa alkaa menneisyydessä), se ei validoitunut aikaleimojen oikeellisuutta. Virheelliset tai ei-parsittavat aikamerkkijonot saattoivat johtaa epäloogisiin varauksiin ilman selkeää virhettä.

Virheenkäsittely oli hajanaista. Tietokantaoperaatioiden virheitä ei käsitelty systemaattisesti, mikä saattoi johtaa palvelimen kaatumiseen tai epäselviin vastauksiin API:n käyttäjälle. Lisäksi virhevastausten rakenne ei ollut yhtenäinen, eikä kaikkia virhetilanteita eroteltu tarkoituksenmukaisilla HTTP-statuskoodeilla.

## 3. Mitkä olivat tärkeimmät parannukset ja miksi?

Parannukset tehtiin vaiheittain ja tarkoituksella rajatusti, jotta muutokset olivat selkeästi perusteltavissa ja helposti seurattavissa commit-historiassa.

Ensimmäiseksi keskityin liiketoimintalogiikan selkeyteen ja luettavuuteen. Vaikka päällekkäisyyslogiikka toimi jo lähtökohtaisesti oikein, muutin sen yksiselitteisempään muotoon (startTime < end AND endTime > start), jotta aikavälien päällekkäisyyden tulkinta on helppo ymmärtää ja ylläpitää.

Seuraavaksi täydensin aikavalidointia lisäämällä eksplisiittisen tarkistuksen virheellisille aikaleimoille. Tämä estää epäloogiset varaukset tilanteissa, joissa syöte ei ole kelvollinen päivämäärä, ja tekee API:n käyttäytymisestä ennustettavampaa.

Kolmannessa vaiheessa selkeytin virheenkäsittelyä. Lisäsin yhtenäisen virheenkäsittelymallin, joka varmistaa, että tietokantavirheet ja muut odottamattomat tilanteet eivät kaada palvelinta, vaan palauttavat selkeän ja johdonmukaisen JSON-muotoisen virhevastausen oikealla HTTP-statuskoodilla.

Lopuksi lisäsin testit vasta sen jälkeen, kun keskeinen liiketoimintalogiikka ja virheenkäsittely oli korjattu. Näin testit todentavat korjatun ja tarkoituksenmukaisen toiminnan eivätkä vain alkuperäisen, puutteellisen toteutuksen käyttäytymistä. Testaus rajattiin liiketoiminnan kannalta kriittisiin edge case -tilanteisiin, jotta kokonaisuus pysyi selkeänä eikä ylilaajentunut tehtävän tavoitteiden ulkopuolelle.

## Rajaukset ja tietoiset valinnat

Tekoäly ehdotti useita tuotantovalmiuteen liittyviä lisäparannuksia, kuten CI/CD-putkea, Swagger-dokumentaatiota, rate limiting -mekanismeja ja laajempaa konfiguraatiohallintaa. Päätin rajata nämä pois, koska tehtävän keskeinen tavoite oli arvioida tekoälyn tuottaman koodin laatua, havaita sen puutteet ja parantaa ratkaisua harkitusti, eikä rakentaa täysimittaista tuotantoympäristöä.
