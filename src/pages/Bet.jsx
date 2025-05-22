import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { FaWallet, FaPlusCircle, FaMinusCircle } from 'react-icons/fa';

const WingoBetting = () => {
  const [timeSlot, setTimeSlot] = useState("30s");
  const [countdown, setCountdown] = useState(30);
  const [periods, setPeriods] = useState({
    "30s": generatePeriodNumber("30s", 1),
    "1min": generatePeriodNumber("1min", 1),
    "3min": generatePeriodNumber("3min", 1),
    "5min": generatePeriodNumber("5min", 1),
  });

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [bigSmall, setBigSmall] = useState("");
  const [amount, setAmount] = useState(0);
  const [wallet, setWallet] = useState(0); // Default balance set to ₹ 0
  const [betList, setBetList] = useState([]);
  const [betCount, setBetCount] = useState(0); // Track number of bets placed
  const [gameHistory, setGameHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("Game history");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasRecharged, setHasRecharged] = useState(false); // Track if user has recharged
  const [isBetLocked, setIsBetLocked] = useState(false); // Track if betting is locked
  const [requiredRecharge, setRequiredRecharge] = useState(0); // Track required recharge for withdrawal

  // Recharge and Withdraw States
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    ifsc: '',
    accountNumber: '',
    upiId: '',
  });
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [utrNumber, setUtrNumber] = useState(''); // Track UTR input
  const [hasRedirectedToUPI, setHasRedirectedToUPI] = useState(false); // Track UPI redirect

  const timeValues = {
    "30s": 30,
    "1min": 60,
    "3min": 180,
    "5min": 300,
  };

  function generatePeriodNumber(slot, seq) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}${slot}${String(seq).padStart(4, "0")}`;
  }

  // Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const currentPeriod = periods[timeSlot];
          let simulatedResult;
          const latestBet = betList.find(
            (bet) => bet.period === currentPeriod && bet.status === "Pending"
          );

          if (latestBet) {
            if (latestBet.color === "Green") {
              simulatedResult = 1; // Green (odd number)
            } else if (latestBet.color === "Red") {
              simulatedResult = 2; // Red (even number)
            } else if (latestBet.color === "Violet") {
              simulatedResult = 0; // Violet (0 or 5)
            } else if (latestBet.number !== null) {
              simulatedResult = latestBet.number; // Match the user's number
            } else if (latestBet.bigSmall === "Big") {
              simulatedResult = 6; // Big (≥5)
            } else if (latestBet.bigSmall === "Small") {
              simulatedResult = 4; // Small (<5)
            } else {
              simulatedResult = Math.floor(Math.random() * 10); // Fallback
            }
          } else {
            simulatedResult = Math.floor(Math.random() * 10); // Random if no bet
          }

          // Add result to gameHistory (only once per period)
          const resultEntry = {
            period: currentPeriod,
            number: simulatedResult,
            bigSmall: simulatedResult >= 5 ? "Big" : "Small",
            color:
              simulatedResult === 0 || simulatedResult === 5
                ? "Violet"
                : simulatedResult % 2 === 0
                ? "Red"
                : "Green",
          };
          setGameHistory((prev) => {
            // Avoid duplicate results for the same period
            if (prev.some((entry) => entry.period === currentPeriod)) {
              return prev;
            }
            return [resultEntry, ...prev.slice(0, 9)];
          });

          // Update bets for the current period
          setBetList((prevBets) => {
            let walletUpdated = false;
            const updatedBets = prevBets.map((bet) => {
              if (bet.status === "Pending" && bet.period === currentPeriod) {
                let winnings = 0;
                let status = "Lost";

                // Check if bet matches result
                if (
                  (bet.color && bet.color === resultEntry.color) ||
                  (bet.number !== null && bet.number === resultEntry.number) ||
                  (bet.bigSmall && bet.bigSmall === resultEntry.bigSmall)
                ) {
                  if (bet.color) {
                    winnings = bet.amount * 2; // 2x for color win
                  } else if (bet.number !== null) {
                    winnings = bet.amount * 9; // 9x for number win
                  } else if (bet.bigSmall) {
                    winnings = bet.amount * 2; // 2x for Big/Small win
                  }
                  status = "Won";
                }

                // Update wallet only once
                if (!walletUpdated && winnings > 0) {
                  setWallet((prev) => prev + winnings);
                  walletUpdated = true;
                }

                return { ...bet, status, winnings };
              }
              return bet;
            });
            return updatedBets;
          });

          // Update period
          const slot = timeSlot;
          const current = periods[slot];
          const nextSeq = parseInt(current.slice(-4)) + 1;
          const updated = generatePeriodNumber(slot, nextSeq);
          setPeriods((prev) => ({ ...prev, [slot]: updated }));

          return timeValues[timeSlot];
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeSlot, periods, betList]);

  // Place Bet
  const placeBet = () => {
    setErrorMessage(""); // Reset error message

    // Check if betting is locked
    if (isBetLocked) {
      setErrorMessage("Betting is locked. Please make a withdraw or recharge to unlock 🔓");
      return;
    }

    // Check if user has reached the bet limit (3 bets)
    if (betCount >= 3) {
      setIsBetLocked(true);
      setErrorMessage("Betting is locked. Please make a withdraw or recharge to unlock 🔓");
      return;
    }

    if (amount <= 0) {
      setErrorMessage("Please select a valid amount");
      return;
    }
    if (!selectedColor && selectedNumber === null && !bigSmall) {
      setErrorMessage("Please select at least one betting option");
      return;
    }
    if (amount > wallet) {
      setErrorMessage("Please make deposit");
      return;
    }

    const newBet = {
      period: periods[timeSlot],
      color: selectedColor,
      number: selectedNumber,
      bigSmall,
      amount,
      timeSlot,
      status: "Pending",
      winnings: 0,
    };

    setBetList((prev) => [newBet, ...prev]);
    setBetCount((prev) => prev + 1); // Increment bet count
    setWallet((prev) => prev - amount);
    setSelectedColor("");
    setSelectedNumber(null);
    setBigSmall("");
    setAmount(0);
  };

  // Amount Input Change
  const handleAmountChange = (value) => {
    setAmount(value);
    setErrorMessage(""); // Clear error message when selecting a new amount
  };

  // Recharge Functionality
  const handleRecharge = (rechargeAmt) => {
    const entry = {
      amount: parseFloat(rechargeAmt),
      status: 'Pending',
      time: new Date().toLocaleString(),
    };
    setRechargeHistory([entry, ...rechargeHistory]);
    setHasRedirectedToUPI(true); // Mark that user has redirected to UPI
    setErrorMessage("");
  };

  // Confirm Recharge
  const confirmRecharge = (index) => {
    if (!hasRedirectedToUPI) {
      setErrorMessage("Please recharge now");
      return;
    }

    if (!utrNumber || utrNumber.length !== 12 || isNaN(utrNumber)) {
      setErrorMessage("Please recharge now");
      return;
    }

    const updatedHistory = [...rechargeHistory];
    const entry = updatedHistory[index];
    if (entry.status === 'Pending') {
      setWallet((prev) => prev + entry.amount);
      updatedHistory[index].status = 'Success';
      setRechargeHistory(updatedHistory);
      setBetCount(0); // Reset bet count after recharge
      setIsBetLocked(false); // Unlock betting after recharge
      setHasRecharged(true); // Mark that user has recharged
      if (requiredRecharge > 0 && entry.amount >= requiredRecharge) {
        setRequiredRecharge(0); // Clear required recharge
      }
      setUtrNumber(''); // Clear UTR number after successful confirmation
      setHasRedirectedToUPI(false); // Reset UPI redirect flag
    }
  };

  // Withdraw Functionality
  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt) {
      setErrorMessage("Sahi amount daalein");
      return;
    }
    if (amt < 110) {
      setErrorMessage("Minimum withdraw amount is ₹110");
      return;
    }
    if (amt > 3000) {
      setErrorMessage("Maximum withdraw amount is ₹3000");
      return;
    }
    if (amt > wallet) {
      setErrorMessage("Balance kam hai");
      return;
    }
    // Prevent withdrawal if user hasn't recharged
    if (!hasRecharged) {
      if (amt >= 100 && amt <= 500) {
        setRequiredRecharge(200);
        setErrorMessage("Please recharge ₹200 to withdraw winnings from initial ₹10 balance.");
        return;
      } else if (amt > 500 && amt <= 800) {
        setRequiredRecharge(400);
        setErrorMessage("Please recharge ₹400 to withdraw winnings from initial ₹10 balance.");
        return;
      } else if (amt > 800) {
        setRequiredRecharge(1000);
        setErrorMessage("Please recharge ₹1000 to withdraw winnings from initial ₹10 balance.");
        return;
      }
    }
    // Check if required recharge is pending
    if (requiredRecharge > 0) {
      setErrorMessage(`Please recharge ₹${requiredRecharge} to proceed with withdrawal.`);
      return;
    }
    const entry = {
      amount: amt,
      bank: bankDetails.bankName,
      upi: bankDetails.upiId,
      status: 'Pending',
      time: new Date().toLocaleString(),
    };
    setWithdrawHistory([entry, ...withdrawHistory]);
    setWallet((prev) => prev - amt);
    setWithdrawAmount('');
    setBankDetails({ bankName: '', ifsc: '', accountNumber: '', upiId: '' });
    setErrorMessage("");
    setIsBetLocked(false); // Unlock betting after withdraw
    setBetCount(0); // Reset bet count after withdraw
  };

  return (
    <div className="min-h-screen bg-white text-center font-sans">
      {/* Tabs Section */}
      <div className="bg-blue-600 p-2 flex justify-around text-white">
        <button className="font-bold">RBWIN</button>
        <button>Live</button>
        <button>Bet</button>
        <button>Wallet</button>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 rounded-b-3xl">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center">
            <img
              src="https://91clubapp.in/images/logo.png"
              alt="91Club Logo"
              className="w-8 h-8 rounded-full mr-2"
              onError={(e) => (e.target.src = "https://via.placeholder.com/32")}
            />
            <span className="text-lg font-bold">91Club RBWIN mod</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white bg-opacity-90 p-4 mt-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-red-500">₹{wallet.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Wallet Balance</div>
          <div className="flex justify-center gap-3 mt-3">
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Withdraw
            </button>
            <button
              onClick={() => setIsRechargeModalOpen(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Deposit
            </button>
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4"
          >
            <div className="flex items-center justify-center mb-4">
              <FaWallet className="text-3xl text-indigo-400 mr-2" />
              <h2 className="text-2xl font-bold text-black">Recharge Wallet</h2>
            </div>
            <div className="mb-4">
              <h3 className="text-lg mb-2 flex items-center text-black">
                <FaPlusCircle className="mr-2" /> Recharge
              </h3>
              <div className="flex space-x-2 mb-2">
                {[200, 500, 1000].map((amt) => (
                  <a
                    key={amt}
                    href={`upi://pay?pa=my2160272@okhdfcbank&pn=Recharge&cu=INR&am=${amt}`}
                    className="bg-indigo-700 px-3 py-1 rounded hover:bg-indigo-800 text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleRecharge(amt)}
                  >
                    ₹{amt}
                  </a>
                ))}
              </div>
              <a
                href="upi://pay?pa=my2160272@okhdfcbank&pn=Recharge&cu=INR"
                className="w-full bg-green-500 py-2 rounded font-semibold text-white text-center block"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleRecharge(200)}
              >
                Submit Recharge
              </a>
              {errorMessage && (
                <div className="text-center text-red-500 mt-2">{errorMessage}</div>
              )}
              {rechargeHistory.length > 0 && (
                <div className="mt-4 text-sm text-black">
                  <p className="mb-2 font-semibold">Pay using UPI below:</p>
                  <p className="bg-gray-100 text-black p-2 rounded mb-2 font-mono">
                    UPI: my2160272@okhdfcbank<br />
                    UPI: yadav060@ptaxis
                  </p>
                  <div className="flex space-x-2">
                    {["PhonePe", "Google Pay", "Paytm"].map((app) => (
                      <a
                        key={app}
                        href={`upi://pay?pa=my2160272@okhdfcbank&cu=INR`}
                        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {app}
                      </a>
                    ))}
                  </div>
                  <div className="mt-4 bg-yellow-100 text-yellow-900 rounded p-3 text-sm font-medium">
                    <p>1. न्यूनतम रिचार्ज राशि: <span className="font-bold">₹200</span></p>
                    <p>2. कृपया कम से कम ₹200 का रिचार्ज करें। यदि आप ₹200 से कम का रिचार्ज करते हैं:</p>
                    <ul className="list-disc ml-5 mt-1">
                      <li>System रिचार्ज ट्रैक नहीं कर पाएगा</li>
                      <li>Wallet में पैसे Add नहीं होंगे</li>
                    </ul>
                    <hr className="my-2 border-yellow-400" />
                    <p>1. Minimum recharge amount: <span className="font-bold">₹200</span></p>
                    <p>2. Please recharge with at least ₹200. If you recharge less than ₹200:</p>
                    <ul className="list-disc ml-5 mt-1">
                      <li>System will not be able to track your payment</li>
                      <li>Wallet amount will not be credited</li>
                    </ul>
                  </div>
                  <p className="text-xs mt-2 text-yellow-600">* Admin recharge</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-lg mb-2 text-black">Recharge History</h3>
              {rechargeHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No recharge yet.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {rechargeHistory.map((r, i) => (
                    <li key={i} className="bg-gray-100 p-2 rounded flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span>₹{r.amount} - {r.status} ({r.time})</span>
                        {r.status === 'Pending' && (
                          <button
                            onClick={() => confirmRecharge(i)}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                      {r.status === 'Pending' && (
                        <input
                          type="text"
                          placeholder="Enter 12-digit UTR number"
                          className="w-full p-2 rounded text-black border border-gray-300 bg-white font-bold"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setIsRechargeModalOpen(false)}
              className="mt-4 w-full bg-red-500 py-2 rounded font-semibold text-white"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4"
          >
            <div className="flex items-center justify-center mb-4">
              <FaWallet className="text-3xl text-indigo-400 mr-2" />
              <h2 className="text-2xl font-bold text-black">Withdraw Funds</h2>
            </div>
            <div className="mb-4">
              <h3 className="text-lg mb-2 flex items-center text-black">
                <FaMinusCircle className="mr-2" /> Withdraw
              </h3>
              <input
                type="number"
                placeholder="Withdraw Amount"
                className="w-full p-2 rounded mb-2 text-black border border-gray-300"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <input
                type="text"
                placeholder="Bank Name"
                className="w-full p-2 rounded mb-2 text-black border border-gray-300"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              />
              <input
                type="text"
                placeholder="IFSC Code"
                className="w-full p-2 rounded mb-2 text-black border border-gray-300"
                value={bankDetails.ifsc}
                onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
              />
              <input
                type="text"
                placeholder="Account Number"
                className="w-full p-2 rounded mb-2 text-black border border-gray-300"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              />
              <input
                type="text"
                placeholder="UPI ID (optional)"
                className="w-full p-2 rounded mb-2 text-black border border-gray-300"
                value={bankDetails.upiId}
                onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
              />
              <button
                onClick={handleWithdraw}
                className="w-full bg-red-500 py-2 rounded font-semibold text-white"
              >
                Submit Withdraw
              </button>
              {errorMessage && (
                <div className="text-center text-red-500 mt-2">{errorMessage}</div>
              )}
              <p className="text-xs mt-2 text-yellow-600">* Withdraw request admin verify karega</p>
            </div>
            <div className="mt-4">
              <h3 className="text-lg mb-2 text-black">Withdraw History</h3>
              {withdrawHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No withdraw yet.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {withdrawHistory.map((w, i) => (
                    <li key={i} className="bg-gray-100 p-2 rounded">
                      ₹{w.amount} - {w.status} ({w.time})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setIsWithdrawModalOpen(false)}
              className="mt-4 w-full bg-red-500 py-2 rounded font-semibold text-white"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Time Slot Selection */}
      <div className="flex justify-around bg-white p-4 mt-4">
        {["30s", "1min", "3min", "5min"].map((slot) => (
          <button
            key={slot}
            onClick={() => {
              setTimeSlot(slot);
              setCountdown(timeValues[slot]);
            }}
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${
              timeSlot === slot
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Win Go {slot}
          </button>
        ))}
      </div>

      {/* Timer and Period */}
      <div className="bg-red-500 text-white p-4 rounded-t-3xl mt-4">
        <div className="text-center text-lg font-bold mb-2">
          RBWIN Bypass period & result
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <span className="text-sm">How to play</span>
          </div>
          <div className="text-right">
            <div className="text-sm">Time remaining</div>
            <div className="text-2xl font-bold">
              {Math.floor(countdown / 10)}
              {countdown % 10}
            </div>
            <div className="text-sm">{periods[timeSlot]}</div>
          </div>
        </div>
      </div>

      {/* Color Selection */}
      <div className="bg-white p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {["Green", "Violet", "Red"].map((clr) => (
            <button
              key={clr}
              onClick={() => {
                setSelectedColor(clr);
                setSelectedNumber(null);
                setBigSmall("");
                setErrorMessage("");
              }}
              className={`py-3 rounded-lg text-white font-bold text-lg ${
                clr === "Green"
                  ? "bg-green-500"
                  : clr === "Violet"
                  ? "bg-purple-500"
                  : "bg-red-500"
              } ${selectedColor === clr ? "ring-2 ring-gray-800" : ""}`}
            >
              {clr}
            </button>
          ))}
        </div>

        {/* Number Selection (91Club Style) */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedNumber(i);
                setSelectedColor("");
                setBigSmall("");
                setErrorMessage("");
              }}
              className={`w-12 h-12 rounded-full font-bold text-white text-lg flex items-center justify-center shadow-lg transition-transform transform hover:scale-105 ${
                i === 0 || i === 5
                  ? "bg-gradient-to-br from-purple-500 to-purple-700"
                  : i % 2 === 0
                  ? "bg-gradient-to-br from-red-500 to-red-700"
                  : "bg-gradient-to-br from-green-500 to-green-700"
              } ${selectedNumber === i ? "ring-4 ring-yellow-400" : ""}`}
            >
              {i}
            </button>
          ))}
        </div>

        {/* Amount Input (91Club Style) */}
        <div className="mb-4">
          <div className="flex justify-center mb-2">
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              className="w-40 p-2 rounded-lg border border-gray-300 text-center text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {[10, 50, 100, 500, 1000].map((val) => (
              <button
                key={val}
                onClick={() => handleAmountChange(val)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  amount === val
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                ₹{val}
              </button>
            ))}
          </div>
          {/* Place Bet Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={placeBet}
              className="w-40 bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
              disabled={isBetLocked}
            >
              Place Bet
            </button>
          </div>
          {/* Error Message Display */}
          {(errorMessage || isBetLocked) && (
            <div className="text-center text-red-500 mt-2">
              {errorMessage || "Betting is locked. Please make a withdraw or recharge to unlock 🔓"}
            </div>
          )}
        </div>
      </div>

      {/* Game History Section */}
      <div className="bg-white p-4 mt-4">
        <h3 className="text-lg font-bold text-black mb-2">Game History</h3>
        {gameHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No results yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-black">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Period</th>
                  <th className="p-2 text-center">Number</th>
                  <th className="p-2 text-center">Color</th>
                  <th className="p-2 text-center">Big/Small</th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.map((result, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{result.period}</td>
                    <td className="p-2 text-center">{result.number}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`inline-block w-4 h-4 rounded-full ${
                          result.color === "Green"
                            ? "bg-green-500"
                            : result.color === "Violet"
                            ? "bg-purple-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                    </td>
                    <td className="p-2 text-center">{result.bigSmall}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bet History Section */}
      <div className="bg-white p-4 mt-4">
        <h3 className="text-lg font-bold text-black mb-2">Bet History</h3>
        {betList.length === 0 ? (
          <p className="text-sm text-gray-500">No bets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-black">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Period</th>
                  <th className="p-2 text-center">Bet Type</th>
                  <th className="p-2 text-center">Amount</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-center">Winnings</th>
                </tr>
              </thead>
              <tbody>
                {betList.map((bet, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{bet.period}</td>
                    <td className="p-2 text-center">
                      {bet.color
                        ? bet.color
                        : bet.number !== null
                        ? `Number ${bet.number}`
                        : bet.bigSmall}
                    </td>
                    <td className="p-2 text-center">₹{bet.amount}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`${
                          bet.status === "Won"
                            ? "text-green-500"
                            : bet.status === "Lost"
                            ? "text-red-500"
                            : "text-yellow-500"
                        } font-semibold`}
                      >
                        {bet.status}
                      </span>
                    </td>
                    <td className="p-2 text-center">₹{bet.winnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WingoBetting;
