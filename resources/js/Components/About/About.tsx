import { BsBuildingFillCheck } from "react-icons/bs";
import { FaFileAlt } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";
import Title from "../../../Layouts/Title";
import Card from "./Card";

const About = () => {
    return (
        <section
            id="about"
            className="w-full py-20 px-6 lg:px-10"
        >
            {/* Office Introduction */}
            <Title
                title="About the Office"
                des="Legal Office and Document Management Services"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-10">
                <Card
                    title="Legal Documentation"
                    des="Comprehensive management of legal documents, contracts, policies, and regulatory compliance materials with secure storage and version control."
                    icon={<HiDocumentText />}
                />
                <Card
                    title="Document Archiving"
                    des="Professional archiving services for legal records, case files, and administrative documents with organized categorization and retrieval systems."
                    icon={<FaFileAlt />}
                />
                <Card
                    title="Legal Compliance"
                    des="Ensuring all documentation meets legal standards and regulatory requirements while maintaining confidentiality and data protection protocols."
                    icon={<BsBuildingFillCheck />}
                />
            </div>
        </section>
    );
};

export default About;
