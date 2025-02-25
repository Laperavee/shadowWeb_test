require("dotenv").config();
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        
        const params = {
            name: "TEST",
            symbol: "TEST",
            totalSupply: "10000000",
            liquidity: "10",
            shadowAddress: process.env.SHADOW_ADDRESS,
            shadowTokenAddress: process.env.SHADOW_TOKEN,
            maxWalletPercentage: "1",
            fullAccess: false
        };

        console.log("\nDéploiement avec les paramètres:", params);
        console.log("Compte déployeur:", deployer.address);

        // Connexion au contrat Shadow
        const shadow = await ethers.getContractAt("Shadow", params.shadowAddress);

        // Obtenir les frais de déploiement en SHADOW
        const fee = await shadow.shadowDeploymentFee();
        console.log("\nFrais de déploiement:", ethers.formatEther(fee), "SHADOW");

        // Générer le salt
        console.log("\nGénération du salt...");
        const { salt, token } = await shadow.generateSalt(
            deployer.address,
            params.name,
            params.symbol,
            ethers.parseEther(params.totalSupply),
            params.maxWalletPercentage
        );
        console.log("Salt généré:", salt);
        console.log("Token généré:", token);

        // Connexion au token SHADOW
        const shadowToken = await ethers.getContractAt("IERC20", params.shadowTokenAddress);

        // Vérifier la balance
        const balance = await shadowToken.balanceOf(deployer.address);
        const balanceFormatted = ethers.formatEther(balance);
        console.log("Balance SHADOW:", balanceFormatted);

        // Vérifier si la balance est suffisante
        const shadowFee = await shadow.shadowDeploymentFee();
        const requiredFee = ethers.formatEther(shadowFee);
        console.log("Frais requis:", requiredFee);

        if (balance < shadowFee) {
            throw new Error(`Balance SHADOW insuffisante. Vous avez ${balanceFormatted} mais ${requiredFee} sont requis`);
        }

        // Vérifier et mettre à jour l'allowance
        const allowance = await shadowToken.allowance(deployer.address, params.shadowAddress);
        console.log("Allowance actuelle:", ethers.formatEther(allowance), "SHADOW");

        if (allowance < shadowFee) {
            console.log("Approbation des tokens SHADOW...");
            const approveTx = await shadowToken.approve(params.shadowAddress, ethers.parseEther("1000"));
            await approveTx.wait();
            console.log("Tokens SHADOW approuvés");
        }

        // Déployer le token
        console.log("\nDéploiement du token en cours...");
        try {
            const tx = await shadow.deployToken(
                params.name,
                params.symbol,
                ethers.parseEther(params.totalSupply),
                ethers.parseEther(params.liquidity),
                10000, // fee tier 1%
                salt,
                deployer.address,
                params.maxWalletPercentage,
                { 
                    value: ethers.parseEther("0.00001"), // 0.00001 ETH
                    gasLimit: 8000000
                }
            );

            console.log("Transaction envoyée:", tx.hash);
            const receipt = await tx.wait(3);
            console.log("Transaction confirmée dans le bloc:", receipt.blockNumber);
            
            // Debug des logs
            console.log("Nombre de logs:", receipt.logs.length);
            
            // Chercher l'événement TokenCreated
            const tokenCreatedEvent = receipt.logs.find(log => {
                try {
                    return log.topics[0] === ethers.id(
                        "TokenCreated(address,uint256,address,string,string,uint256)"
                    );
                } catch {
                    return false;
                }
            });

            if (tokenCreatedEvent) {
                const tokenAddress = tokenCreatedEvent.args ? 
                    tokenCreatedEvent.args[0] : 
                    `0x${tokenCreatedEvent.topics[1].slice(26)}`;
                
                console.log("\n✓ Token déployé avec succès à l'adresse:", tokenAddress);
                
                // Récupérer l'adresse de la pool
                const uniswapFactory = await ethers.getContractAt(
                    "IUniswapV3Factory",
                    process.env.UNISWAP_V3_FACTORY
                );
                const poolAddress = await uniswapFactory.getPool(
                    tokenAddress,
                    process.env.SHADOW_TOKEN,
                    10000 // fee tier 1%
                );
                console.log("Pool créée à l'adresse:", poolAddress);
                
                // Mettre à jour le fichier .env
                const fs = require('fs');
                const envFile = '.env';
                const envContent = fs.readFileSync(envFile, 'utf8');
                const updatedContent = envContent.replace(
                    /^TOKEN_POOL_ADDRESS=.*$/m,
                    `TOKEN_POOL_ADDRESS=${poolAddress}`
                );
                fs.writeFileSync(envFile, updatedContent);
                console.log("✓ .env mis à jour avec TOKEN_POOL_ADDRESS");

                console.log("Explorer:", `https://basescan.org/address/${tokenAddress}`);

                // Vérification du contrat
                console.log("\nVérification du contrat en cours...");
                try {
                    await hre.run("verify:verify", {
                        address: tokenAddress,
                        contract: "contracts/Shadow.sol:Token",
                        constructorArguments: [
                            params.name + " by Shadow",  // finalName
                            params.symbol,
                            ethers.parseEther(params.totalSupply),
                            deployer.address,
                            process.env.UNISWAP_V3_FACTORY,
                            process.env.POSITION_MANAGER,
                            params.maxWalletPercentage,
                            params.fullAccess
                        ],
                    });
                    console.log("✓ Contrat vérifié avec succès !");
                } catch (error) {
                    if (error.message.toLowerCase().includes("already verified")) {
                        console.log("Le contrat est déjà vérifié");
                    } else {
                        console.error("Erreur lors de la vérification:", error);
                    }
                }
            }
        } catch (error) {
            console.error("Erreur lors du déploiement du token:", error);
            throw error;
        }

    } catch (error) {
        console.error("Erreur:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });