const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

// describe blocks dont need async functions
developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", function () {
          let raffle
          let deployer, raffleEntranceFee

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              //   await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("Works with live chainlink keepers and Chainlink VRF, we get a random winner", async function () {
                  console.log("Setting up test...")
                  const startingTimestamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  // Listener
                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance =
                                  await accounts[0].getBalance()
                              const endingTimeStamp =
                                  await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              )
                              assert.equal(raffleState, "0")
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(raffleEntranceFee)
                                      .toString()
                              )
                              assert(endingTimeStamp > startingTimestamp)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      //Enter the raffle
                      const tx = await raffle.enterRaffle({
                          value: raffleEntranceFee,
                      })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance =
                          await accounts[0].getBalance()
                      // this code wont complete until our listener has finished listening
                  })
              })
          })
      })
