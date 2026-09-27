const API_BASE_URL = "https://pokeapi.co/api/v2"
const TYPE_COLORS = { normal: "#8c8c76", fire: "#ee8130", water: "#6390f0", electric: "#f7d02c", grass: "#7ac74c", ice: "#96d9d6", fighting: "#c22e28", poison: "#a33ea1", ground: "#e2bf65", flying: "#a98ff3", psychic: "#f95587", bug: "#a6b91a", rock: "#b6a136", ghost: "#735797", dragon: "#6f35fc", dark: "#705746", steel: "#b7b7ce", fairy: "#d685ad" }

const searchForm = document.querySelector("#search-form")
const pokemonInput = document.querySelector("#pokemon-input")
const searchButton = document.querySelector("#search-button")
const statusMessage = document.querySelector("#status-message")
const resultArea = document.querySelector("#pokemon-result")

async function getPokemon(searchTerm) {
    const response = await fetch(`${API_BASE_URL}/pokemon/${encodeURIComponent(searchTerm)}`)
    if (!response.ok) throw new Error("Pokémon not found. Check the name or Pokédex number and try again.")
    return response.json()
}

async function getPokemonSpecies(searchTerm) {
    const response = await fetch(`${API_BASE_URL}/pokemon-species/${encodeURIComponent(searchTerm)}`)
    if (!response.ok) throw new Error("Species information could not be loaded.")
    return response.json()
}

function getEnglishDescription(speciesData) {
    const entry = speciesData.flavor_text_entries.find(item => item.language.name === "en")
    return entry ? entry.flavor_text.replace(/[\n\f]/g, " ") : "No English description is available for this Pokémon."
}

function getEnglishGenus(speciesData) {
    const entry = speciesData.genera.find(item => item.language.name === "en")
    return entry ? entry.genus : "Pokémon"
}

function createElement(tagName, className, textContent = "") {
    const element = document.createElement(tagName)
    element.className = className
    element.textContent = textContent
    return element
}

function createTypeBadge(typeName) {
    const badge = createElement("li", "type-badge", typeName)
    badge.style.setProperty("--type-color", TYPE_COLORS[typeName] || "#65728a")
    return badge
}

function createStatRow(stat) {
    const row = createElement("div", "stat-row")
    const statName = stat.stat.name.replace("special-", "Sp. ")
    const track = createElement("div", "stat-track")
    const bar = createElement("div", "stat-bar")
    bar.style.width = `${Math.min((stat.base_stat / 255) * 100, 100)}%`
    track.appendChild(bar)
    row.append(createElement("span", "stat-name", statName), track, createElement("span", "stat-value", stat.base_stat))
    return row
}

function renderPokemon(pokemonData, speciesData) {
    resultArea.innerHTML = ""
    const card = createElement("article", "pokemon-card")
    const identity = createElement("div", "pokemon-identity")
    const image = document.createElement("img")
    image.className = "pokemon-image"
    image.src = pokemonData.sprites.other["official-artwork"].front_default || pokemonData.sprites.front_default
    image.alt = `${pokemonData.name} official artwork`

    const identityText = createElement("div", "identity-text")
    const number = createElement("p", "pokemon-number", `#${String(pokemonData.id).padStart(4, "0")}`)
    const name = createElement("h2", "pokemon-name", pokemonData.name)
    const genus = createElement("p", "pokemon-genus", getEnglishGenus(speciesData))
    const types = createElement("ul", "type-list")
    pokemonData.types.forEach(entry => types.appendChild(createTypeBadge(entry.type.name)))
    identityText.append(number, name, genus, types)
    identity.append(image, identityText)

    const details = createElement("div", "details-grid")
    const overview = createElement("section", "overview")
    const facts = createElement("div", "facts")
    const height = createElement("div", "fact")
    const weight = createElement("div", "fact")
    const experience = createElement("div", "fact")
    height.append(createElement("span", "fact-label", "Height"), createElement("span", "fact-value", `${pokemonData.height / 10} m`))
    weight.append(createElement("span", "fact-label", "Weight"), createElement("span", "fact-value", `${pokemonData.weight / 10} kg`))
    experience.append(createElement("span", "fact-label", "Base XP"), createElement("span", "fact-value", pokemonData.base_experience))
    facts.append(height, weight, experience)

    const abilities = createElement("ul", "ability-list")
    pokemonData.abilities.forEach(entry => abilities.appendChild(createElement("li", "ability-badge", entry.ability.name)))
    overview.append(createElement("h2", "section-title", "Overview"), facts, createElement("p", "description", getEnglishDescription(speciesData)), createElement("h2", "section-title", "Abilities"), abilities)

    const statsSection = createElement("section", "stats-section")
    statsSection.appendChild(createElement("h2", "section-title", "Base stats"))
    pokemonData.stats.forEach(stat => statsSection.appendChild(createStatRow(stat)))
    details.append(overview, statsSection)
    card.append(identity, details)
    resultArea.appendChild(card)
}

function showStatus(message, isError = false) {
    statusMessage.textContent = message
    statusMessage.classList.toggle("error", isError)
}

function setLoading(isLoading) {
    searchButton.disabled = isLoading
    searchButton.textContent = isLoading ? "Searching..." : "Search"
}

async function handleSearch(event) {
    event.preventDefault()
    const searchTerm = pokemonInput.value.trim().toLowerCase()
    if (!searchTerm) { showStatus("Enter a Pokémon name or Pokédex number.", true); return }
    setLoading(true)
    showStatus("Searching Pokédex...")
    resultArea.innerHTML = ""

    try {
        const [pokemonData, speciesData] = await Promise.all([getPokemon(searchTerm), getPokemonSpecies(searchTerm)])
        renderPokemon(pokemonData, speciesData)
        showStatus(`Showing ${pokemonData.name}.`)
    } catch (error) {
        resultArea.innerHTML = ""
        const errorState = createElement("div", "empty-state")
        errorState.append(createElement("h2", "", "We could not find that Pokémon"), createElement("p", "", error.message))
        resultArea.appendChild(errorState)
        showStatus(error.message, true)
    } finally {
        setLoading(false)
    }
}

searchForm.addEventListener("submit", handleSearch)
