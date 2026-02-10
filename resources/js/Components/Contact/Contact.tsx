import React, { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import ContactLeft from "./ContactLeft";
import Title from "../../../Layouts/Title";

const Contact: React.FC = () => {
    const [username, setUsername] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [subject, setSubject] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [errMsg, setErrMsg] = useState<string>("");
    const [successMsg, setSuccessMsg] = useState<string>("");

    const emailValidation = (): RegExpMatchArray | null => {
        return String(email)
            .toLowerCase()
            .match(/^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/);
    };

    const handleSend = async (e: FormEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (username === "") {
            setErrMsg("Username is required!");
        } else if (phoneNumber === "") {
            setErrMsg("Phone number is required!");
        } else if (email === "") {
            setErrMsg("Please give your Email!");
        } else if (!emailValidation()) {
            setErrMsg("Give a valid Email!");
        } else if (subject === "") {
            setErrMsg("Plese give your Subject!");
        } else if (message === "") {
            setErrMsg("Message is required!");
        } else {
            try {
                const response = await axios.post('/contact', {
                    username,
                    phone: phoneNumber,
                    email,
                    subject,
                    message
                });

                if (response.status === 200) {
                    setSuccessMsg(
                        `Thank you dear ${username}, your message has been sent successfully!`,
                    );
                    setErrMsg("");
                    setUsername("");
                    setPhoneNumber("");
                    setEmail("");
                    setSubject("");
                    setMessage("");
                }
            } catch (error: any) {
                console.error("Error sending message:", error);
                if (error.response) {
                    // Server responded with error
                    setErrMsg(error.response.data?.message || "Server error. Please try again.");
                } else if (error.request) {
                    // Request made but no response
                    setErrMsg("No response from server. Please check your connection.");
                } else {
                    // Error setting up request
                    setErrMsg("Something went wrong. Please try again later.");
                }
            }
        }
    };

    return (
        <section
            id="contact"
            className="w-full py-20 px-6 lg:px-10"
        >
            <div className="flex justify-center items-center text-center">
                <Title title="CONTACT" des="Contact With Us" />
            </div>
            <div className="w-full mt-10">
                <div className="w-full flex flex-col lgl:flex-row justify-between gap-6">
                    <ContactLeft />
                    <div className="w-full lgl:w-[60%] h-full p-6 lgl:p-10 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100">
                        <form className="w-full flex flex-col gap-8">
                            {(errMsg || successMsg) && (
                                <p
                                    className={`py-4 text-center text-base font-semibold rounded-2xl ${errMsg
                                        ? "bg-red-50 text-red-600 border border-red-100"
                                        : "bg-green-50 text-green-700 border border-green-100"
                                        }`}
                                >
                                    {errMsg || successMsg}
                                </p>
                            )}

                            <div className="w-full flex flex-col gap-6">
                                <h3 className="text-4xl font-black text-gray-900 flex items-center gap-4">
                                    Send Message
                                    <span className="text-yellow-500 text-5xl">!!</span>
                                </h3>

                                <div className="flex flex-col lgl:flex-row gap-6 mt-4">
                                    <div className="w-full lgl:w-1/2 flex flex-col gap-3">
                                        <label className="text-sm text-gray-500 uppercase font-bold tracking-widest pl-1">
                                            Your name
                                        </label>
                                        <input
                                            onChange={(
                                                e: ChangeEvent<HTMLInputElement>,
                                            ) => setUsername(e.target.value)}
                                            value={username}
                                            placeholder="Enter your full name"
                                            className={`bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-green-700 focus:ring-4 focus:ring-green-700/5 outline-none transition-all duration-300 ${errMsg ===
                                                "Username is required!" &&
                                                "border-red-500 bg-red-50"
                                                }`}
                                            type="text"
                                        />
                                    </div>
                                    <div className="w-full lgl:w-1/2 flex flex-col gap-3">
                                        <label className="text-sm text-gray-500 uppercase font-bold tracking-widest pl-1">
                                            Phone Number
                                        </label>
                                        <input
                                            onChange={(
                                                e: ChangeEvent<HTMLInputElement>,
                                            ) => setPhoneNumber(e.target.value)}
                                            value={phoneNumber}
                                            placeholder="+63 --- --- ----"
                                            className={`bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-green-700 focus:ring-4 focus:ring-green-700/5 outline-none transition-all duration-300 ${errMsg ===
                                                "Phone number is required!" &&
                                                "border-red-500 bg-red-50"
                                                }`}
                                            type="text"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm text-gray-500 uppercase font-bold tracking-widest pl-1">
                                    Email Address
                                </label>
                                <input
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                    ) => setEmail(e.target.value)}
                                    value={email}
                                    placeholder="example@email.com"
                                    className={`bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-green-700 focus:ring-4 focus:ring-green-700/5 outline-none transition-all duration-300 ${errMsg === "Please give your Email!" &&
                                        "border-red-500 bg-red-50"
                                        }`}
                                    type="email"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm text-gray-500 uppercase font-bold tracking-widest pl-1">
                                    Subject
                                </label>
                                <input
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                    ) => setSubject(e.target.value)}
                                    value={subject}
                                    placeholder="How can we help?"
                                    className={`bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-green-700 focus:ring-4 focus:ring-green-700/5 outline-none transition-all duration-300 ${errMsg === "Plese give your Subject!" &&
                                        "border-red-500 bg-red-50"
                                        }`}
                                    type="text"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm text-gray-500 uppercase font-bold tracking-widest pl-1">
                                    Message
                                </label>
                                <textarea
                                    onChange={(
                                        e: ChangeEvent<HTMLTextAreaElement>,
                                    ) => setMessage(e.target.value)}
                                    value={message}
                                    placeholder="Write your message here..."
                                    className={`bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-green-700 focus:ring-4 focus:ring-green-700/5 outline-none transition-all duration-300 min-h-[160px] ${errMsg === "Message is required!" &&
                                        "border-red-500 bg-red-50"
                                        }`}
                                    rows={5}
                                />
                            </div>

                            <div className="w-full mt-2">
                                <button
                                    onClick={handleSend}
                                    className="w-full h-16 bg-green-800 text-white rounded-2xl text-lg font-black tracking-widest hover:bg-green-900 border-b-4 border-yellow-600 shadow-xl shadow-green-900/10 transform hover:-translate-y-1 transition-all duration-300"
                                >
                                    SEND MESSAGE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
